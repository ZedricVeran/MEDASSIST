# src/rag.py
import os
from typing import Optional, List
from src.llm import LLM
from src.utils import build_prompt

class ConversationMemory:
    """Stores multi-turn conversation history for a single session"""
    def __init__(self, max_history: int = 5):
        self.max_history = max_history
        self.history: List[dict] = []

    def add(self, role: str, content: str, sources: Optional[List[dict]] = None):
        """Add a message to conversation history"""
        self.history.append({
            "role": role,
            "content": content,
            "sources": sources or []
        })
        # Keep only recent messages
        if len(self.history) > self.max_history * 2:
            self.history = self.history[-(self.max_history * 2):]

    def get_context(self) -> str:
        """Return formatted recent conversation for context"""
        if not self.history:
            return ""
        context = "Previous conversation:\n"
        # last 2 exchanges = 4 messages
        for msg in self.history[-4:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            context += f"{role}: {msg['content']}\n"
        return context

    def clear(self):
        """Clear conversation history"""
        self.history = []


class RAGPipeline:
    """Main Retrieval-Augmented Generation pipeline"""
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
        """Convert distance scores to relevance (0-1)"""
        return [max(0, 1 - d) for d in distances]

    def answer(self, question: str, top_k: Optional[int] = None,
               use_memory: bool = True) -> dict:
        """Generate an answer to the user's question"""

        if top_k is None:
            top_k = self.top_k

        # Embed the question
        q_emb = self.embedder.embed([question])[0]

        # Retrieve top-k relevant docs
        results = self.retriever.query_by_embedding(q_emb, n_results=top_k)
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        relevances = self._calculate_relevance(distances)

        # Filter by confidence threshold
        relevant_docs = []
        relevant_metas = []
        for doc, meta, rel in zip(docs, metas, relevances):
            if rel >= self.confidence_threshold:
                relevant_docs.append(doc)
                relevant_metas.append(meta)

        # Include conversation memory context if enabled
        memory_context = self.memory.get_context() if use_memory else ""

        if not relevant_docs:
            # fallback when no relevant documents
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

        # Store messages in memory
        self.memory.add("user", question)
        self.memory.add("assistant", answer, relevant_metas)

        return {
            "answer": answer,
            "sources": relevant_metas,
            "confidence": confidence,
            "memory_length": len(self.memory.history)
        }

    def _generate_fallback_response(self, question: str, memory_context: str = "") -> str:
        """Generate response when no relevant documents found"""
        context_addition = f"\n\nContext from conversation:\n{memory_context}" if memory_context else ""
        prompt = (
            "You are a comprehensive health information assistant. "
            "Answer health questions professionally and clearly:\n"
            "1. Start with a clear definition.\n"
            "2. Include key characteristics, causes, or mechanisms.\n"
            "3. Provide practical info about symptoms, treatment, or prevention.\n"
            "4. Use natural conversational language.\n"
            "5. If info is incomplete, note it.\n"
            "Keep it polite and suggest consulting a healthcare professional.\n"
            f"{context_addition}\n"
            f"User's question: {question}\n\n"
            "Provide a helpful, professional response:"
        )
        return self.llm.generate(prompt)

    def clear_memory(self):
        """Clear all conversation memory"""
        self.memory.clear()

    def get_conversation_history(self) -> List[dict]:
        """Return full conversation history"""
        return self.memory.history

