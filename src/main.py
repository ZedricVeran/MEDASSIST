import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from src.retriever import VectorStore
from src.llm import LLM
from src.rag import RAGPipeline
from src.embedder import Embedder

load_dotenv()

class Query(BaseModel):
    question: str
    use_memory: bool = True  # Enable memory by default

class ClearMemoryRequest(BaseModel):
    pass

app = FastAPI(title="Health RAG Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VECTOR_DIR = os.getenv("CHROMA_DIR", "./vector_db")
retriever = VectorStore(VECTOR_DIR)
embedder = Embedder()
llm = LLM()
pipeline = RAGPipeline(
    retriever=retriever, 
    llm=llm, 
    embedder=embedder, 
    top_k=int(os.getenv("TOP_K", "4")),
    confidence_threshold = float(os.getenv("CONFIDENCE_THRESHOLD", "0.35")),  # Lowered to 0.35
    enable_paraphrasing = os.getenv("ENABLE_PARAPHRASING", "true").lower() == "true"
)

@app.post("/chat")
def chat(req: Query):
    """Answer user question with multi-turn memory support"""
    return pipeline.answer(req.question, use_memory=req.use_memory)

@app.get("/history")
def get_history():
    """Get conversation history"""
    return {"history": pipeline.get_conversation_history()}

@app.post("/clear")
def clear_memory(req: ClearMemoryRequest):
    """Clear conversation memory"""
    pipeline.clear_memory()
    return {"status": "memory cleared"}