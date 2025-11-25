import os
from dotenv import load_dotenv
load_dotenv()

from loader import PDFLoader
from chunker import TextChunker
from embedder import Embedder
from retriever import VectorStore

# Ignore parsing PDFs grayscale warnings by WHO or government agencies
import logging
logging.getLogger("pdfminer").setLevel(logging.ERROR)

DATA_DIR = os.getenv("DATA_DIR", "./data")
VECTOR_DIR = os.getenv("CHROMA_DIR", "./vector_db")
BATCH_SIZE = 1000  # Process in batches to avoid memory/size limits

def ingest_all():
    loader = PDFLoader()
    chunker = TextChunker()
    embedder = Embedder()
    store = VectorStore(VECTOR_DIR)

    ids = []
    docs = []
    metas = []
    all_texts_for_embedding = []

    # 1. Collect all data from 'data' folder
    for filename in sorted(os.listdir(DATA_DIR)):
        if not filename.lower().endswith(".pdf"):
            continue
        path = os.path.join(DATA_DIR, filename)
        print(f"Loading PDF -> {filename}")

        # Catch error per file and will continue the process
        try:
            pages = loader.load(path)
            for p in pages:
                chunks = chunker.chunk(p["text"])
                for idx, chunk in enumerate(chunks):
                    uid = f"{filename}::p{p['page']}::c{idx}"
                    ids.append(uid)
                    docs.append(chunk)
                    metas.append({
                        "source": filename,
                        "page": p['page'],
                        "chunk_index": idx
                    })
                    all_texts_for_embedding.append(chunk)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            continue

    if not docs:
        print("No documents found to ingest.")
        return

    print(f"Total chunks to embed: {len(docs)}")

    # Embed all texts
    embeddings = embedder.embed(all_texts_for_embedding)

    # 2. Add to vector store in batches
    print("Saving to vector database...")
    total_batches = (len(docs) + BATCH_SIZE - 1) // BATCH_SIZE

    for batch_num in range(total_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min((batch_num + 1) * BATCH_SIZE, len(docs))

        batch_ids = ids[start_idx:end_idx]
        batch_docs = docs[start_idx:end_idx]
        batch_metas = metas[start_idx:end_idx]
        batch_embeddings = embeddings[start_idx:end_idx]

        try:
            store.add(
                ids=batch_ids,
                documents=batch_docs,
                metadatas=batch_metas,
                embeddings=batch_embeddings
            )
            print(f"Batch {batch_num + 1}/{total_batches} saved ({end_idx}/{len(docs)} chunks)")
        except Exception as e:
            print(f"Error saving batch {batch_num + 1}: {e}")
            continue

    store.close()
    print(f"Ingestion complete. Total chunks ingested: {len(docs)}")

if __name__ == "__main__":
    ingest_all()
