# def build_prompt(docs, metas, question):
#     context = ""
#     for d, m in zip(docs, metas):
#         context += f"[{m.get('source','unknown')} - page {m.get('page','?')}]\n{d}\n\n"
#
#     system = (
#         "You are a precise assistant. Answer only using the provided verified context "
#         "from DOH/WHO documents. If the answer is not present, say you don't know. No hallucinations."
#     )
#     return f"{system}\n\nCONTEXT:\n{context}\nQUESTION:\n{question}\nANSWER:"


import os
from typing import Optional, List
import requests

def build_prompt(docs: List[str], metas: List[dict], question: str, include_citations: bool = False) -> str:
    """Build prompt with optional hidden citations"""
    context = ""

    if include_citations:
        # Visible format (keep for internal use)
        for d, m in zip(docs, metas):
            context += f"[{m.get('source', 'unknown')} - page {m.get('page', '?')}]\n{d}\n\n"
    else:
        # Seamless format - just concatenate docs without headers
        for d in docs:
            context += f"{d}\n\n"

    system = (
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
    )

    return f"{system}\n\nHEALTH INFORMATION:\n{context}\nQUESTION:\n{question}\nANSWER:"
