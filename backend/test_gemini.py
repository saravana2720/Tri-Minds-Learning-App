from app.services.llm_service import OllamaService


def main():
    service = OllamaService()

    response = service.get_llm().invoke(
        "Explain StandardScaler in one simple sentence."
    )

    print(response.content)


if __name__ == "__main__":
    main()
