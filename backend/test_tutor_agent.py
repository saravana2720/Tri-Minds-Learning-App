from app.agents.tutor_agent import build_tutor_graph
from app.schemas.tutor import LearningLevel


def main():
    graph = build_tutor_graph()

    result = graph.invoke(
        {
            "topic": "StandardScaler",
            "level": LearningLevel.BEGINNER,
            "response": None,
        }
    )

    response = result["response"]

    print("\n===== TUTOR RESPONSE =====")
    print("Topic:", response.topic)
    print("Level:", response.level)
    print("\nDefinition:")
    print(response.definition)

    print("\nExplanation:")
    print(response.explanation)

    print("\nIntuition:")
    print(response.intuition)

    print("\nReal World Example:")
    print(response.real_world_example)

    print("\nCode:")
    print(response.code)

    print("\nCode Explanation:")
    print(response.code_explanation)

    print("\nCommon Mistakes:")
    for mistake in response.common_mistakes:
        print("-", mistake)

    print("\nWhen To Use:")
    print(response.when_to_use)

    print("\nWhen Not To Use:")
    print(response.when_not_to_use)

    print("\nSummary:")
    print(response.summary)

    print("\nFollow-up Question:")
    print(response.follow_up_question)


if __name__ == "__main__":
    main()