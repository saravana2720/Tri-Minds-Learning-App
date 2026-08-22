from app.agents.learning_plan_agent import build_learning_plan_graph


def main():
    graph = build_learning_plan_graph()

    result = graph.invoke({
        "topic": "Data Science",
        "level": "beginner",
        "duration_weeks": 4,
        "response": None,
    })

    response = result["response"]

    print("\n===== LEARNING PLAN =====")
    print(response.model_dump_json(indent=2))


if __name__ == "__main__":
    main()