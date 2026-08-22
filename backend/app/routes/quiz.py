from fastapi import APIRouter, HTTPException

from app.agents.quiz_agent import (
    build_quiz_graph,
)

from app.schemas.quiz import (
    QuizRequest,
    QuizResponse,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/v1",
    tags=["Quiz"],
)


# =========================================================
# BUILD QUIZ GRAPH
# =========================================================

quiz_graph = build_quiz_graph()


# =========================================================
# QUIZ GENERATION SETTINGS
# =========================================================

# Maximum number of attempts if the LLM generates
# duplicate or invalid questions.
MAX_QUIZ_ATTEMPTS = 3


# =========================================================
# CREATE QUIZ
# =========================================================

@router.post(
    "/quiz",
    response_model=QuizResponse,
)
def create_quiz(
    request: QuizRequest,
) -> QuizResponse:

    last_error = None

    # =====================================================
    # TRY QUIZ GENERATION
    # =====================================================

    for attempt in range(
        1,
        MAX_QUIZ_ATTEMPTS + 1,
    ):

        try:

            print(
                f"Generating quiz... "
                f"Attempt {attempt}/{MAX_QUIZ_ATTEMPTS}"
            )

            # -------------------------------------------------
            # Invoke LangGraph
            # -------------------------------------------------

            result = quiz_graph.invoke(
                {
                    "topic": request.topic,
                    "level": request.level.value,
                    "number_of_questions": (
                        request.number_of_questions
                    ),
                    "response": None,

                    # These are used by the quiz agent
                    # to track previously generated questions.
                    "previous_questions": [],

                    "retry_count": attempt - 1,
                }
            )

            # -------------------------------------------------
            # Get response
            # -------------------------------------------------

            response = result.get(
                "response"
            )

            # -------------------------------------------------
            # Check response
            # -------------------------------------------------

            if response is None:

                raise ValueError(
                    "Quiz agent did not return a response."
                )

            # -------------------------------------------------
            # Successful quiz
            # -------------------------------------------------

            print(
                f"Quiz generated successfully "
                f"on attempt {attempt}."
            )

            return response

        # =====================================================
        # VALIDATION ERROR
        # =====================================================

        except ValueError as exc:

            last_error = str(exc)

            print(
                f"QUIZ VALIDATION ERROR "
                f"(attempt {attempt}): "
                f"{last_error}"
            )

            # -------------------------------------------------
            # Retry if attempts remain
            # -------------------------------------------------

            if attempt < MAX_QUIZ_ATTEMPTS:

                print(
                    "Retrying quiz generation..."
                )

                continue

            # -------------------------------------------------
            # All attempts failed
            # -------------------------------------------------

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unable to generate a valid quiz "
                    f"after {MAX_QUIZ_ATTEMPTS} attempts. "
                    f"Last error: {last_error}"
                ),
            ) from exc

        # =====================================================
        # UNEXPECTED ERROR
        # =====================================================

        except Exception as exc:

            print(
                f"QUIZ SERVICE ERROR "
                f"(attempt {attempt}): "
                f"{exc}"
            )

            # -------------------------------------------------
            # Don't retry unexpected server errors
            # -------------------------------------------------

            raise HTTPException(
                status_code=500,
                detail=(
                    "Quiz generation failed. "
                    "Please try again."
                ),
            ) from exc

    # =========================================================
    # SAFETY FALLBACK
    # =========================================================

    raise HTTPException(
        status_code=500,
        detail=(
            "Quiz generation failed unexpectedly."
        ),
    )