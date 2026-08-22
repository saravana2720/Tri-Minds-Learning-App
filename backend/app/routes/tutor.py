from fastapi import APIRouter, HTTPException

from app.agents.tutor_agent import build_tutor_graph
from app.schemas.tutor import TutorRequest, TutorResponse


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/v1",
    tags=["Tutor"],
)


# =========================================================
# TUTOR GRAPH
# =========================================================

tutor_graph = build_tutor_graph()


# =========================================================
# TUTOR API
# =========================================================

@router.post(
    "/tutor",
    response_model=TutorResponse,
)
def tutor(request: TutorRequest) -> TutorResponse:

    try:

        # -------------------------------------------------
        # RUN LANGGRAPH
        # -------------------------------------------------

        result = tutor_graph.invoke(
            {
                "topic": request.topic,
                "level": request.level,   # IMPORTANT FIX
                "question": request.question,
                "response": None,
            }
        )

        # -------------------------------------------------
        # GET AGENT RESPONSE
        # -------------------------------------------------

        response = result.get("response")

        if response is None:
            raise ValueError(
                "Tutor agent did not return a response."
            )

        # -------------------------------------------------
        # IF ALREADY PYDANTIC MODEL
        # -------------------------------------------------

        if isinstance(response, TutorResponse):
            return response

        # -------------------------------------------------
        # IF DICTIONARY
        # -------------------------------------------------

        if isinstance(response, dict):

            return TutorResponse(
                topic=response.get(
                    "topic",
                    request.topic,
                ),

                level=response.get(
                    "level",
                    request.level,
                ),

                question=response.get(
                    "question",
                    request.question,
                ),

                definition=response.get(
                    "definition",
                    "",
                ),

                explanation=response.get(
                    "explanation",
                    "",
                ),

                intuition=response.get(
                    "intuition",
                    "",
                ),

                real_world_example=response.get(
                    "real_world_example",
                    "",
                ),

                code=response.get(
                    "code",
                    "",
                ),

                code_explanation=response.get(
                    "code_explanation",
                    "",
                ),

                common_mistakes=response.get(
                    "common_mistakes",
                    [],
                ),

                when_to_use=response.get(
                    "when_to_use",
                    "",
                ),

                when_not_to_use=response.get(
                    "when_not_to_use",
                    "",
                ),

                summary=response.get(
                    "summary",
                    "",
                ),

                follow_up_question=response.get(
                    "follow_up_question",
                    "",
                ),
            )

        # -------------------------------------------------
        # INVALID RESPONSE
        # -------------------------------------------------

        raise ValueError(
            "Tutor agent returned an invalid response format."
        )

    # =====================================================
    # VALIDATION / BUSINESS ERROR
    # =====================================================

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    # =====================================================
    # UNEXPECTED ERROR
    # =====================================================

    except Exception as exc:

        print(
            f"Tutor service error: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Tutor service error: {str(exc)}"
            ),
        ) from exc