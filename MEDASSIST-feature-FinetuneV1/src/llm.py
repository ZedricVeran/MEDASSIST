# src/llm.py
import requests

class LLM:
    """
    LLM wrapper for remote Ollama 'gemma3:4b' endpoint.
    """

    def __init__(self, model="gemma3:4b", endpoint_url="http://127.0.0.1:11434/v1/chat/completions"):
        self.model = model
        self.endpoint_url = endpoint_url

    def generate(self, prompt: str) -> str:
        """
        Send a prompt to the Ollama model and return the response.
        """
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
            "temperature": 0.7
        }

        try:
            response = requests.post(self.endpoint_url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            # Ollama response format: choices -> message -> content
            choices = data.get("choices", [])
            if choices and "message" in choices[0]:
                return choices[0]["message"].get("content", "")
            
            return "Sorry, I could not generate a response at this time."
        
        except Exception as e:
            print("Error calling remote LLM:", e)
            return "Sorry, I could not generate a response at this time."

    def paraphrase(self, text: str) -> str:
        """
        Optional: paraphrase text using the model
        """
        prompt = f"Paraphrase the following in a clear and conversational way:\n{text}"
        return self.generate(prompt)
