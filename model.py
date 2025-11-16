# RAG MODEL CODE
# All imported libraries
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import OllamaLLM
from langchain.chains import RetrievalQA


# main
loader = PyPDFLoader("")
documents = loader.load()
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=300)
chunks= text_splitter.split_documents(documents)

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectore_store = Chroma.from_documents(documents=chunks, embedding=embeddings)
retirever = vectore_store.as_retriever(search_kwargs={"k": 3})

# intial model to be used, focused model for better results on the way
llm = OllamaLLM(model="gemma:4b", temperature=0.7)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm, 
    chain_type="stuff",
    retriever=retirever,
    return_source_documents=True
    )
question = "insert question"
response = qa_chain.run(question)
print(response['result'])