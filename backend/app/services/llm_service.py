from langchain_ollama import ChatOllama


class OllamaService:

    def __init__(self):
        self.llm = ChatOllama(
            model="llama3.2:latest",

            # Stable and deterministic quiz generation
            temperature=0,

            # Keep model loaded in memory
            # Avoid loading/unloading Ollama model every request
            keep_alive="10m",

            # Smaller context = faster processing
            num_ctx=4096,

            # Limit generated tokens
            # Helps prevent unnecessary long explanations
            num_predict=1800,
        )

    def get_llm(self) -> ChatOllama:
        return self.llm