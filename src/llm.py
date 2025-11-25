import os
import requests

class LLM:
    def __init__(self):
        self.host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "gemma3:4b")

    def generate(self, prompt):
        url = f"{self.host}/v1/chat/completions"

        payload = {
            "model": self.model,
            # "prompt": prompt,
            "messages": [{"role": "user", "content": prompt}],
            # "stream": False,
            "temperature": 0.0
        }

        r = requests.post(url, json=payload)
        r.raise_for_status()
        data = r.json()

        if "response" in data:
            return data["response"]

        if "choices" in data:
            return data["choices"][0]["message"]["content"]

        return str(data)

    def paraphrase(self, text: str) -> str:
        """Make technical health text more conversational"""
        prompt = (
            "You are a health communication expert."
            "Rewrite the following health information to be more conversational, friendly, and easier to understand for a general audience. "
            "Keep all medical accuracy but use simpler language. Don't add new information.\n\n"
            f"Original text:\n{text}\n\n"
            "Rewritten in conversational tone:"
        )
        return self.generate(prompt)