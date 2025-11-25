import os
from typing import Optional, List
from src.llm import LLM
from src.utils import build_prompt

class ConversationMemory:
    def __init__(self, max_history: int = 5):
        self.max_history = max_history
        self.history: List[dict] = []

    def add(self, role: str, content: str, sources: Optional[List[dict]] = None):
        # Add message to conversation history
        self.history.append({
            "role": role,
            "content": content,
            "sources": sources or []
        })
        # Keep only recent messages
        if len(self.history) > self.max_history * 2:
            self.history = self.history[-(self.max_history * 2):]

    def get_context(self) -> str:
        # Format conversation history as context
        if not self.history:
            return ""

        context = "Previous conversation:\n"
        for msg in self.history[-4:]:  # Last 2 exchanges
            role = "User" if msg["role"] == "user" else "Assistant"
            context += f"{role}: {msg['content']}\n"
        return context

    def clear(self):
        # Clear conversation history
        self.history = []


class RAGPipeline:
    def __init__(self, retriever, llm: LLM, embedder, top_k: int = 6,
                 confidence_threshold: float = 0.35, enable_paraphrasing: bool = True):
        self.retriever = retriever
        self.llm = llm
        self.embedder = embedder
        self.top_k = top_k  # Increased from 4 to 6
        self.confidence_threshold = confidence_threshold  # Lowered from 0.5 to 0.35
        self.enable_paraphrasing = enable_paraphrasing
        self.memory = ConversationMemory(max_history=5)

    def _calculate_relevance(self, distances: List[float]) -> List[float]:
        # Convert distance scores to relevance (0-1, higher is better)
        return [max(0, 1 - d) for d in distances]

    def answer(self, question: str, top_k: Optional[int] = None,
               use_memory: bool = True) -> dict:

        # Generate answer with optional conversation memory
        # Args:
        #     question: User's question
        #     top_k: Number of documents to retrieve (overrides default)
        #     use_memory: Whether to use conversation history for context

        if top_k is None:
            top_k = self.top_k

        q_emb = self.embedder.embed([question])[0]
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

        # Add conversation context if enabled
        memory_context = ""
        if use_memory:
            memory_context = self.memory.get_context()

        if not relevant_docs:
            answer = self._generate_fallback_response(question, memory_context)
            confidence = "low"
        else:
            prompt = build_prompt(relevant_docs, relevant_metas, question, include_citations=False)

            # Add memory context to prompt if available
            if memory_context:
                prompt = memory_context + "\n\n" + prompt

            answer = self.llm.generate(prompt)

            # Optionally paraphrase for more conversational tone
            if self.enable_paraphrasing:
                answer = self.llm.paraphrase(answer)

            confidence = "high"

        # Store in memory
        self.memory.add("user", question)
        self.memory.add("assistant", answer, relevant_metas)

        return {
            "answer": answer,
            "sources": relevant_metas,
            "confidence": confidence,
            "memory_length": len(self.memory.history)
        }

    def _generate_fallback_response(self, question: str, memory_context: str = "") -> str:
        # Generate helpful response when no relevant docs found
        context_addition = ""
        if memory_context:
            context_addition = f"\n\nContext from our conversation:\n{memory_context}"

        prompt = (
            "You are a comprehensive health information assistant."
            "When answering health questions:\n"
            "1. START with a clear, complete definition of what the condition/topic is\n"
            "2. Include basic characteristics, causes, or mechanisms if relevant\n"
            "3. Provide practical information about symptoms, treatment, or prevention\n"
            "4. Use natural, conversational language without mentioning document sources\n"
            "5. If information is incomplete, note what related information you found\n\n"
            "Answer thoroughly and make sure the user understands the fundamental concept being asked about."
            "Answer the user's question clearly and accurately based on the provided health information. "
            "Use natural language and avoid mentioning that you're reading from documents. "
            "If the provided information doesn't answer the question, offer related information or suggest consulting a healthcare professional."
            "No hallucinations."
            "Respond politely, acknowledge their concern, be warm, and suggest they speak with a healthcare professional."
            "Keep it conversational and not dismissive."
            f"{context_addition}\n\n"
            f"User's question: {question}\n\n"
            "Provide a helpful, professional response:"
        )
        return self.llm.generate(prompt)

    def clear_memory(self):
        # Clear conversation history
        self.memory.clear()

    def get_conversation_history(self) -> List[dict]:
        # Get full conversation history
        return self.memory.history