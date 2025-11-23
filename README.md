# mediAssist
Provides verified health information from DOH or WHO PDFs. Uses RAG to answer local health queries.


Create venv:
python -m venv venv

Run venv:
venv\Scripts\activate

Install requirements:
pip install -r requirements.txt

Create data folder 'data' then put all documents inside

Ingest the data:
python src/ingest_docs.py

Run program:
uvicorn src.main:app --reload --port 8000

Open index.html to run chatbot