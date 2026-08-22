from langchain_ollama import ChatOllama


class OllamaService:

    def __init__(self):
        self.llm = ChatOllama(
            model="llama3.2:latest",
            temperature=0,
        )

    def get_llm(self) -> ChatOllama:
        return self.llm