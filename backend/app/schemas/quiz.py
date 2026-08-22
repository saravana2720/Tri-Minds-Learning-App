from pydantic import BaseModel, Field, field_validator

from app.schemas.tutor import LearningLevel


# =========================================================
# QUIZ REQUEST
# =========================================================

class QuizRequest(BaseModel):
    """
    Request body used to generate a quiz.
    """

    topic: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Topic for the quiz",
    )

    level: LearningLevel = Field(
        ...,
        description="Difficulty level of the quiz",
    )

    number_of_questions: int = Field(
        ...,
        ge=1,
        le=20,
        description="Number of questions to generate",
    )

    # -----------------------------------------------------
    # Validate topic
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


# =========================================================
# QUIZ QUESTION
# =========================================================

class QuizQuestion(BaseModel):
    """
    Represents one multiple-choice quiz question.
    """

    id: int = Field(
        ...,
        ge=1,
        description="Sequential question ID",
    )

    question: str = Field(
        ...,
        min_length=1,
        description="Question text",
    )

    options: list[str] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="Exactly four answer options",
    )

    correct_answer: str = Field(
        ...,
        min_length=1,
        description=(
            "Correct answer. "
            "Can be option text or A/B/C/D."
        ),
    )

    explanation: str = Field(
        ...,
        min_length=1,
        description="Explanation for the correct answer",
    )

    # -----------------------------------------------------
    # Validate question
    # -----------------------------------------------------

    @field_validator("question")
    @classmethod
    def validate_question(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Question cannot be empty."
            )

        return value

    # -----------------------------------------------------
    # Validate options
    # -----------------------------------------------------

    @field_validator("options")
    @classmethod
    def validate_options(
        cls,
        value: list[str],
    ) -> list[str]:

        if len(value) != 4:
            raise ValueError(
                "Each question must have exactly 4 options."
            )

        cleaned_options = []

        for option in value:

            if not isinstance(option, str):
                raise ValueError(
                    "Each option must be a string."
                )

            cleaned_option = option.strip()

            if not cleaned_option:
                raise ValueError(
                    "Options cannot be empty."
                )

            cleaned_options.append(
                cleaned_option
            )

        # -------------------------------------------------
        # Duplicate options
        # -------------------------------------------------

        normalized_options = [
            option.casefold()
            for option in cleaned_options
        ]

        if len(normalized_options) != len(
            set(normalized_options)
        ):
            raise ValueError(
                "Options must be unique."
            )

        return cleaned_options

    # -----------------------------------------------------
    # Validate correct answer
    # -----------------------------------------------------

    @field_validator("correct_answer")
    @classmethod
    def validate_correct_answer(
        cls,
        value: str,
    ) -> str:

        if not isinstance(value, str):
            raise ValueError(
                "Correct answer must be a string."
            )

        value = value.strip()

        if not value:
            raise ValueError(
                "Correct answer cannot be empty."
            )

        return value

    # -----------------------------------------------------
    # Validate explanation
    # -----------------------------------------------------

    @field_validator("explanation")
    @classmethod
    def validate_explanation(
        cls,
        value: str,
    ) -> str:

        if not isinstance(value, str):
            raise ValueError(
                "Explanation must be a string."
            )

        value = value.strip()

        if not value:
            raise ValueError(
                "Explanation cannot be empty."
            )

        return value


# =========================================================
# QUIZ RESPONSE
# =========================================================

class QuizResponse(BaseModel):
    """
    Complete quiz response returned by the API.
    """

    topic: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Quiz topic",
    )

    level: LearningLevel = Field(
        ...,
        description="Quiz difficulty level",
    )

    questions: list[QuizQuestion] = Field(
        ...,
        min_length=1,
        max_length=20,
        description="List of quiz questions",
    )

    # -----------------------------------------------------
    # Validate topic
    # -----------------------------------------------------

    @field_validator("topic")
    @classmethod
    def validate_topic(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Quiz topic cannot be empty."
            )

        return value

    # -----------------------------------------------------
    # Normalize correct answer
    # -----------------------------------------------------

    @staticmethod
    def normalize_correct_answer(
        question: QuizQuestion,
    ) -> str:

        correct_answer = (
            question.correct_answer
            .strip()
        )

        normalized_correct = (
            correct_answer.casefold()
        )

        normalized_options = [
            option.strip().casefold()
            for option in question.options
        ]

        # =================================================
        # CASE 1: EXACT OPTION TEXT
        # =================================================

        for index, option in enumerate(
            normalized_options
        ):

            if normalized_correct == option:

                return question.options[index]

        # =================================================
        # CASE 2: A / B / C / D
        # CASE 3: 1 / 2 / 3 / 4
        # =================================================

        answer_map = {
            "a": 0,
            "b": 1,
            "c": 2,
            "d": 3,
            "1": 0,
            "2": 1,
            "3": 2,
            "4": 3,
        }

        if normalized_correct in answer_map:

            option_index = answer_map[
                normalized_correct
            ]

            return question.options[
                option_index
            ]

        # =================================================
        # CASE 4: A. TEXT / B. TEXT
        # CASE 5: A) TEXT / B) TEXT
        # =================================================

        if len(normalized_correct) >= 2:

            prefix = normalized_correct[:2]

            prefix_map = {
                "a.": 0,
                "b.": 1,
                "c.": 2,
                "d.": 3,
                "a)": 0,
                "b)": 1,
                "c)": 2,
                "d)": 3,
                "1.": 0,
                "2.": 1,
                "3.": 2,
                "4.": 3,
                "1)": 0,
                "2)": 1,
                "3)": 2,
                "4)": 3,
            }

            if prefix in prefix_map:

                option_index = prefix_map[
                    prefix
                ]

                answer_text = (
                    normalized_correct[2:]
                    .strip()
                )

                expected_option = (
                    normalized_options[
                        option_index
                    ]
                )

                # If the text after A./B. matches
                if answer_text == expected_option:

                    return question.options[
                        option_index
                    ]

        # =================================================
        # CASE 6: "A - TEXT"
        # =================================================

        if len(normalized_correct) >= 3:

            prefix = normalized_correct[:2]

            if prefix in {
                "a-",
                "b-",
                "c-",
                "d-",
                "1-",
                "2-",
                "3-",
                "4-",
            }:

                option_index = {
                    "a-": 0,
                    "b-": 1,
                    "c-": 2,
                    "d-": 3,
                    "1-": 0,
                    "2-": 1,
                    "3-": 2,
                    "4-": 3,
                }[prefix]

                answer_text = (
                    normalized_correct[2:]
                    .strip()
                )

                expected_option = (
                    normalized_options[
                        option_index
                    ]
                )

                if answer_text == expected_option:

                    return question.options[
                        option_index
                    ]

        # =================================================
        # NO MATCH
        # =================================================

        raise ValueError(
            f"Question {question.id}: "
            "correct_answer must match "
            "one of the options."
        )

    # -----------------------------------------------------
    # Validate questions
    # -----------------------------------------------------

    @field_validator("questions")
    @classmethod
    def validate_questions(
        cls,
        value: list[QuizQuestion],
    ) -> list[QuizQuestion]:

        if not value:

            raise ValueError(
                "Quiz must contain at least one question."
            )

        # =================================================
        # QUESTION IDs
        # =================================================

        expected_ids = list(
            range(
                1,
                len(value) + 1,
            )
        )

        actual_ids = [
            question.id
            for question in value
        ]

        if actual_ids != expected_ids:

            raise ValueError(
                "Question IDs must be sequential "
                "starting from 1. "
                f"Expected {expected_ids}, "
                f"received {actual_ids}."
            )

        # =================================================
        # DUPLICATE QUESTION DETECTION
        # =================================================

        normalized_questions = []

        for question in value:

            normalized_question = (
                " ".join(
                    question.question
                    .strip()
                    .casefold()
                    .split()
                )
            )

            # Remove common punctuation
            for character in [
                "?",
                ".",
                ",",
                "!",
                ":",
                ";",
                "-",
            ]:

                normalized_question = (
                    normalized_question.replace(
                        character,
                        "",
                    )
                )

            normalized_questions.append(
                normalized_question
            )

        if len(normalized_questions) != len(
            set(normalized_questions)
        ):

            raise ValueError(
                "Quiz contains duplicate questions."
            )

        # =================================================
        # VALIDATE EACH QUESTION
        # =================================================

        for question in value:

            # -------------------------------------------------
            # Validate option count
            # -------------------------------------------------

            if len(question.options) != 4:

                raise ValueError(
                    f"Question {question.id} "
                    "must have exactly 4 options."
                )

            # -------------------------------------------------
            # Validate empty options
            # -------------------------------------------------

            for option in question.options:

                if not option.strip():

                    raise ValueError(
                        f"Question {question.id} "
                        "contains an empty option."
                    )

            # -------------------------------------------------
            # Validate duplicate options
            # -------------------------------------------------

            normalized_options = [
                option.strip().casefold()
                for option in question.options
            ]

            if len(normalized_options) != len(
                set(normalized_options)
            ):

                raise ValueError(
                    f"Question {question.id} "
                    "contains duplicate options."
                )

            # -------------------------------------------------
            # Normalize correct answer
            # -------------------------------------------------

            matched_option = (
                cls.normalize_correct_answer(
                    question
                )
            )

            # -------------------------------------------------
            # Replace with exact option text
            # -------------------------------------------------

            question.correct_answer = (
                matched_option
            )

            # -------------------------------------------------
            # Explanation
            # -------------------------------------------------

            if not question.explanation.strip():

                raise ValueError(
                    f"Question {question.id} "
                    "explanation cannot be empty."
                )

        return value