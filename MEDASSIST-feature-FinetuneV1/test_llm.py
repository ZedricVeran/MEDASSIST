import requests

url = "http://127.0.0.1:11434/v1/chat/completions"

payload = {
    "model": "gemma3:4b",  # <-- specify your model here
    "messages": [
        {"role": "user", "content": "What is hypertension?"}
    ],
    "max_tokens": 100
}

resp = requests.post(url, json=payload)
print(resp.json())
