from enum import Enum

from pydantic import BaseModel, Field, field_validator


# =========================================================
# LEARNING LEVEL
# =========================================================

class LearningLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


# =========================================================
# TUTOR REQUEST
# =========================================================

class TutorRequest(BaseModel):

    topic: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Learning topic",
    )

    level: LearningLevel = Field(
        ...,
        description="Student experience level",
    )

    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Student question",
    )

    # -----------------------------------------------------
    # VALIDATE TOPIC
    # -----------------------------------------------------

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, value: str) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Topic cannot be empty."
            )

        return value

    # -----------------------------------------------------
    # VALIDATE QUESTION
    # -----------------------------------------------------

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Question cannot be empty."
            )

        return value


# =========================================================
# TUTOR RESPONSE
# =========================================================

class TutorResponse(BaseModel):

    topic: str

    level: LearningLevel

    question: str

    definition: str

    explanation: str

    intuition: str

    real_world_example: str

    code: str

    code_explanation: str

    common_mistakes: list[str]

    when_to_use: str

    when_not_to_use: str

    summary: str

    follow_up_question: str