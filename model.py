# Modern LangChain 1.0 RAG Pipeline

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import OllamaLLM

from langchain_core.runnables import RunnableMap, RunnablePassthrough
from langchain_core.prompts import PromptTemplate


# 1. Load PDF
loader = PyPDFLoader("Clinical Practice Acute Stroke.pdf")
documents = loader.load()

# 2. Split text into chunks
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=300
)
chunks = text_splitter.split_documents(documents)

# 3. Build vector store
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store = Chroma.from_documents(chunks, embedding=embeddings)
retriever = vector_store.as_retriever(search_kwargs={"k": 3})

# 4. Build LLM
llm = OllamaLLM(model="gemma3:4b", temperature=0.7)

# 5. Prompt Template
prompt = PromptTemplate.from_template(
    """
You are MEDASSIST, a responsible and helpful medical assistant. 
Use only the information provided in the given context to answer questions concisely, 
accurately, and in clear, easy-to-understand language. When steps or actions are required, 
present them in bullet points for clarity. Provide recommendations based solely on what 
the user is currently feeling, as described in the context, and if the context indicates 
severe, worsening, or red-flag symptoms, you should recommend contacting emergency services
or seeking immediate medical care. If the context does not contain enough information to 
answer safely, state that the information is insufficient rather than guessing. Maintain an 
empathetic, calm, and non-judgmental tone, avoid inventing any medical details, diagnoses, 
or treatments not included in the context, and do not provide personalized medical advice 
unless explicitly supported by the context. Remember that you are not a substitute for a 
licensed healthcare provider.

Context:
{context}

Question:
{question}

Answer:
"""
)

# 6. Using runnables
rag_chain = (
    RunnableMap({
        "context": retriever,
        "question": RunnablePassthrough()
    })
    | prompt
    | llm
)

# 7. Run a query
question = input("Please enter your question:")
response = rag_chain.invoke(question)

print(response)
