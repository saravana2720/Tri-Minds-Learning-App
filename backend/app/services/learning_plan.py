from app.schemas.learning_plan import (
    LearningPlanRequest,
    LearningPlanResponse,
    WeekPlan,
)


def generate_learning_plan(
    request: LearningPlanRequest,
) -> LearningPlanResponse:

    weeks = []

    for week_number in range(1, request.duration_weeks + 1):
        weeks.append(
            WeekPlan(
                week=week_number,
                title=f"{request.topic} - Week {week_number}",
                topics=[
                    f"{request.topic} fundamentals",
                    f"{request.topic} practical concepts",
                ],
                practice_task=(
                    f"Practice {request.topic} concepts "
                    f"for {request.level.value} level."
                ),
            )
        )

    return LearningPlanResponse(
        topic=request.topic,
        level=request.level,
        duration_weeks=request.duration_weeks,
        weeks=weeks,
    )