from fastapi import APIRouter

from app.agents.learning_plan_agent import build_learning_plan_graph
from app.schemas.learning_plan import (
    LearningPlanRequest,
    LearningPlanResponse,
)

router = APIRouter()

learning_plan_graph = build_learning_plan_graph()


@router.post(
    "/learning-plan",
    response_model=LearningPlanResponse,
)
def create_learning_plan(
    request: LearningPlanRequest,
) -> LearningPlanResponse:

    result = learning_plan_graph.invoke({
        "topic": request.topic,
        "level": request.level.value,
        "duration_weeks": request.duration_weeks,
        "response": None,
    })

    return result["response"]