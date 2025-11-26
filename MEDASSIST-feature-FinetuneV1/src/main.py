import os
from typing import Optional, List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.llm import LLM
from src.utils import build_prompt
from src.embedder import Embedder
from src.retriever import VectorStore

# ---------------------
# Conversation Memory
# ---------------------
class ConversationMemory:
    def __init__(self, max_history: int = 5):
        self.max_history = max_history
        self.history: List[dict] = []

    def add(self, role: str, content: str, sources: Optional[List[dict]] = None):
        self.history.append({"role": role, "content": content, "sources": sources or []})
        if len(self.history) > self.max_history * 2:
            self.history = self.history[-(self.max_history * 2):]

    def get_context(self) -> str:
        if not self.history:
            return ""
        context = "Previous conversation:\n"
        for msg in self.history[-4:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            context += f"{role}: {msg['content']}\n"
        return context

    def clear(self):
        self.history = []

# ---------------------
# RAG Pipeline
# ---------------------
class RAGPipeline:
    def __init__(self, retriever, llm: LLM, embedder, top_k: int = 6,
                 confidence_threshold: float = 0.35, enable_paraphrasing: bool = True):
        self.retriever = retriever
        self.llm = llm
        self.embedder = embedder
        self.top_k = top_k
        self.confidence_threshold = confidence_threshold
        self.enable_paraphrasing = enable_paraphrasing
        self.memory = ConversationMemory(max_history=5)

    def _calculate_relevance(self, distances: List[float]) -> List[float]:
        return [max(0, 1 - d) for d in distances]

    def answer(self, question: str, top_k: Optional[int] = None, use_memory: bool = True) -> dict:
        if top_k is None:
            top_k = self.top_k

        q_emb = self.embedder.embed([question])[0]
        results = self.retriever.query_by_embedding(q_emb, n_results=top_k)

        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        relevances = self._calculate_relevance(distances)

        relevant_docs, relevant_metas = [], []
        for doc, meta, rel in zip(docs, metas, relevances):
            if rel >= self.confidence_threshold:
                relevant_docs.append(doc)
                relevant_metas.append(meta)

        memory_context = self.memory.get_context() if use_memory else ""

        if not relevant_docs:
            answer = self._generate_fallback_response(question, memory_context)
            confidence = "low"
        else:
            prompt = build_prompt(relevant_docs, relevant_metas, question, include_citations=False)
            if memory_context:
                prompt = memory_context + "\n\n" + prompt
            answer = self.llm.generate(prompt)
            if self.enable_paraphrasing:
                answer = self.llm.paraphrase(answer)
            confidence = "high"

        self.memory.add("user", question)
        self.memory.add("assistant", answer, relevant_metas)

        return {"answer": answer, "sources": relevant_metas, "confidence": confidence,
                "memory_length": len(self.memory.history)}

    def _generate_fallback_response(self, question: str, memory_context: str = "") -> str:
        context_addition = f"\n\nContext from our conversation:\n{memory_context}" if memory_context else ""
        prompt = (
            "You are a comprehensive health information assistant. "
            f"{context_addition}\n\nUser's question: {question}\n\n"
            "Provide a helpful, professional response:"
        )
        return self.llm.generate(prompt)

    def clear_memory(self):
        self.memory.clear()

    def get_conversation_history(self) -> List[dict]:
        return self.memory.history

# ---------------------
# FastAPI Backend
# ---------------------
# Initialize components
VECTOR_DB_PATH = "vector_db"
retriever = VectorStore(persist_path=VECTOR_DB_PATH)
llm = LLM()
embedder = Embedder()
rag_pipeline = RAGPipeline(retriever=retriever, llm=llm, embedder=embedder)

app = FastAPI()

# Enable CORS for React frontend (Vite default port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class QuestionPayload(BaseModel):
    question: str
    top_k: int = 6
    use_memory: bool = True

# POST /api/ask -> Ask a question
@app.post("/api/ask")
async def ask_question(payload: QuestionPayload):
    try:
        print("Payload received:", payload)
        result = rag_pipeline.answer(
            question=payload.question,
            top_k=payload.top_k,
            use_memory=payload.use_memory
        )
        return result
    except Exception as e:
        print("Error in /api/ask:", e)
        return {"error": str(e)}

# GET /api/history -> Get conversation memory
@app.get("/api/history")
async def get_history():
    return {"history": rag_pipeline.get_conversation_history()}

# POST /api/clear -> Clear memory
@app.post("/api/clear")
async def clear_memory():
    rag_pipeline.clear_memory()
    return {"status": "memory cleared"}
