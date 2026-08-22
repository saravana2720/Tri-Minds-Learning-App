from typing import Optional, TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas.learning_plan import LearningPlanResponse
from app.schemas.tutor import LearningLevel
from app.services.llm_service import OllamaService


# =========================================================
# STATE
# =========================================================

class LearningPlanState(TypedDict):
    topic: str
    level: str
    duration_weeks: int
    response: Optional[LearningPlanResponse]


# =========================================================
# VALIDATE INPUT
# =========================================================

def validate_input(
    state: LearningPlanState,
) -> LearningPlanState:

    topic = state["topic"].strip()
    level = state["level"].strip().lower()
    duration_weeks = int(state["duration_weeks"])

    # Validate topic
    if not topic:
        raise ValueError("Topic cannot be empty.")

    # Validate duration
    if duration_weeks < 1:
        raise ValueError(
            "Duration must be at least 1 week."
        )

    if duration_weeks > 12:
        raise ValueError(
            "Duration cannot exceed 12 weeks."
        )

    # Validate learning level
    try:
        LearningLevel(level)
    except ValueError:
        raise ValueError(
            f"Invalid learning level: {level}. "
            "Allowed values: beginner, intermediate, advanced."
        )

    return {
        **state,
        "topic": topic,
        "level": level,
        "duration_weeks": duration_weeks,
    }


# =========================================================
# GENERATE LEARNING PLAN
# =========================================================

def generate_learning_plan(
    state: LearningPlanState,
) -> LearningPlanState:

    topic = state["topic"]
    level = state["level"]
    duration_weeks = state["duration_weeks"]

    llm = OllamaService().get_llm()

    structured_llm = llm.with_structured_output(
        LearningPlanResponse
    )

    # Maximum number of attempts
    max_attempts = 3

    last_error = None

    for attempt in range(1, max_attempts + 1):

        prompt = f"""
You are an expert AI Learning Plan Generator.

Generate a personalized learning plan.

IMPORTANT:
You MUST generate EXACTLY {duration_weeks} weeks.

Topic:
{topic}

Learning Level:
{level}

Duration:
{duration_weeks} weeks


STRICT RULES:

1. Return EXACTLY {duration_weeks} weekly plans.

2. The week numbers MUST be consecutive.

3. You MUST include every week number from:

1 to {duration_weeks}

4. Do NOT skip any week.

5. Do NOT generate fewer weeks.

6. Do NOT generate more weeks.

7. Each week must contain:

- week number
- title
- multiple learning topics
- exactly one practice_task

8. Start with fundamentals.

9. Gradually increase difficulty.

10. Keep everything relevant to:

{topic}

11. Match this learning level:

{level}

12. Create exactly one final_project.

13. The final_project must combine the
concepts learned throughout all weeks.


EXAMPLE WEEK STRUCTURE:

Week 1
Title: Fundamentals
Topics:
- Topic 1
- Topic 2
Practice Task:
Build a small project


You MUST generate all weeks:

{", ".join(str(i) for i in range(1, duration_weeks + 1))}

DO NOT STOP EARLY.

Return ONLY valid structured data matching
LearningPlanResponse.
"""

        try:

            print(
                f"Generating learning plan "
                f"(Attempt {attempt}/{max_attempts})..."
            )

            response = structured_llm.invoke(
                prompt
            )

            # -------------------------------------------------
            # Check if response exists
            # -------------------------------------------------

            if response is None:
                last_error = (
                    "LLM returned an empty response."
                )

                continue

            # -------------------------------------------------
            # Check number of weeks
            # -------------------------------------------------

            actual_weeks = len(response.weeks)

            if actual_weeks != duration_weeks:

                last_error = (
                    f"Expected {duration_weeks} weeks, "
                    f"but received {actual_weeks} weeks."
                )

                print(
                    f"Attempt {attempt} failed: "
                    f"{last_error}"
                )

                continue

            # -------------------------------------------------
            # Check week numbers
            # -------------------------------------------------

            expected_numbers = list(
                range(1, duration_weeks + 1)
            )

            actual_numbers = [
                week.week
                for week in response.weeks
            ]

            if actual_numbers != expected_numbers:

                last_error = (
                    f"Expected week numbers "
                    f"{expected_numbers}, "
                    f"but received "
                    f"{actual_numbers}."
                )

                print(
                    f"Attempt {attempt} failed: "
                    f"{last_error}"
                )

                continue

            # -------------------------------------------------
            # Success
            # -------------------------------------------------

            print(
                f"Successfully generated "
                f"{duration_weeks} weeks."
            )

            return {
                **state,
                "response": response,
            }

        except Exception as error:

            last_error = str(error)

            print(
                f"Generation attempt {attempt} failed: "
                f"{last_error}"
            )

    # =====================================================
    # ALL RETRIES FAILED
    # =====================================================

    raise ValueError(
        f"Unable to generate a valid "
        f"{duration_weeks}-week learning plan "
        f"after {max_attempts} attempts. "
        f"Last error: {last_error}"
    )


# =========================================================
# VALIDATE OUTPUT
# =========================================================

def validate_output(
    state: LearningPlanState,
) -> LearningPlanState:

    response = state.get("response")

    # --------------------------------------------------
    # Validate response
    # --------------------------------------------------

    if response is None:
        raise ValueError(
            "Learning Plan Agent did not generate a response."
        )

    expected_weeks = state["duration_weeks"]

    # --------------------------------------------------
    # Validate number of weeks
    # --------------------------------------------------

    if len(response.weeks) != expected_weeks:

        raise ValueError(
            f"Expected {expected_weeks} weeks, "
            f"but received {len(response.weeks)} weeks."
        )

    # --------------------------------------------------
    # Validate week numbers
    # --------------------------------------------------

    expected_week_numbers = list(
        range(1, expected_weeks + 1)
    )

    actual_week_numbers = [
        week.week
        for week in response.weeks
    ]

    if actual_week_numbers != expected_week_numbers:

        raise ValueError(
            f"Invalid week numbers. "
            f"Expected {expected_week_numbers}, "
            f"but received {actual_week_numbers}."
        )

    # --------------------------------------------------
    # Validate each week
    # --------------------------------------------------

    for week in response.weeks:

        # Validate title
        if not week.title.strip():

            raise ValueError(
                f"Week {week.week} "
                f"title cannot be empty."
            )

        # Validate topics
        if not week.topics:

            raise ValueError(
                f"Week {week.week} must contain "
                f"at least one topic."
            )

        # Validate each topic
        for topic in week.topics:

            if not topic.strip():

                raise ValueError(
                    f"Week {week.week} contains "
                    f"an empty topic."
                )

        # Validate practice task
        if not week.practice_task.strip():

            raise ValueError(
                f"Practice task is missing "
                f"for week {week.week}."
            )

    # --------------------------------------------------
    # Validate final project
    # --------------------------------------------------

    if not response.final_project.strip():

        raise ValueError(
            "Final project cannot be empty."
        )

    # --------------------------------------------------
    # Rebuild validated response
    # --------------------------------------------------

    validated_response = LearningPlanResponse(

        topic=state["topic"],

        level=LearningLevel(
            state["level"]
        ),

        duration_weeks=expected_weeks,

        weeks=response.weeks,

        final_project=response.final_project,
    )

    return {
        **state,
        "response": validated_response,
    }


# =========================================================
# BUILD LANGGRAPH
# =========================================================

def build_learning_plan_graph():

    graph = StateGraph(
        LearningPlanState
    )

    # Add nodes

    graph.add_node(
        "validate_input",
        validate_input,
    )

    graph.add_node(
        "generate_learning_plan",
        generate_learning_plan,
    )

    graph.add_node(
        "validate_output",
        validate_output,
    )

    # Graph flow

    graph.add_edge(
        START,
        "validate_input",
    )

    graph.add_edge(
        "validate_input",
        "generate_learning_plan",
    )

    graph.add_edge(
        "generate_learning_plan",
        "validate_output",
    )

    graph.add_edge(
        "validate_output",
        END,
    )

    return graph.compile()