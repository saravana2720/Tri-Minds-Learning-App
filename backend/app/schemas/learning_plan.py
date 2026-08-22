from pydantic import BaseModel, Field

from app.schemas.tutor import LearningLevel


class LearningPlanRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=100)
    level: LearningLevel
    duration_weeks: int = Field(..., ge=1, le=12)


class WeekPlan(BaseModel):
    week: int
    title: str
    topics: list[str]
    practice_task: str


class LearningPlanResponse(BaseModel):
    topic: str
    level: LearningLevel
    duration_weeks: int
    weeks: list[WeekPlan]
    final_project: str