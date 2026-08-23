from typing import Optional, TypedDict
import re

from pydantic import BaseModel, Field
from langgraph.graph import END, START, StateGraph

from app.schemas.quiz import (
    QuizQuestion,
    QuizResponse,
)
from app.schemas.tutor import LearningLevel
from app.services.llm_service import OllamaService


# =========================================================
# QUIZ MEMORY
# =========================================================

QUIZ_MEMORY: dict[str, list[str]] = {}


# =========================================================
# CONFIGURATION
# =========================================================

# Maximum number of Ollama generation attempts.
MAX_BATCH_ATTEMPTS = 3

# Number of recent questions remembered.
MAX_PREVIOUS_QUESTIONS = 6

# Before this attempt, previous-question duplication is
# strictly rejected.
#
# Attempt 1 -> strict
# Attempt 2 -> strict
# Attempt 3 -> relaxed
ALLOW_FALLBACK_AFTER_ATTEMPT = 2


# =========================================================
# QUIZ STATE
# =========================================================

class QuizState(TypedDict):
    topic: str
    level: str
    number_of_questions: int
    response: Optional[QuizResponse]
    previous_questions: list[str]


# =========================================================
# TEMPORARY QUIZ BATCH
# =========================================================
#
# We only ask Ollama for questions.
# Topic and level are already known by our application.
#

class QuizBatch(BaseModel):
    questions: list[QuizQuestion] = Field(
        default_factory=list
    )


# =========================================================
# MEMORY KEY
# =========================================================

def get_memory_key(
    topic: str,
    level: str,
) -> str:
    return (
        f"{topic.strip().casefold()}"
        f"|"
        f"{level.strip().casefold()}"
    )


# =========================================================
# NORMALIZE QUESTION TEXT
# =========================================================

def normalize_question_text(
    question: str,
) -> str:

    if question is None:
        return ""

    text = str(question).strip().casefold()

    # -----------------------------------------------------
    # Remove common numbering
    #
    # Examples:
    # 1. Question
    # 2) Question
    # Q1. Question
    # Q2) Question
    # Question 1:
    # -----------------------------------------------------

    text = re.sub(
        r"^\s*(?:q(?:uestion)?\s*)?\d+\s*[\.\)\:\-]\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # -----------------------------------------------------
    # Remove punctuation
    # -----------------------------------------------------

    text = re.sub(
        r"""["'.,!?;:\-*_/\\()\[\]{}]+""",
        " ",
        text,
    )

    # -----------------------------------------------------
    # Normalize whitespace
    # -----------------------------------------------------

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


# =========================================================
# NORMALIZE OPTION TEXT
# =========================================================

def normalize_option_text(
    text: str,
) -> str:

    if text is None:
        return ""

    value = str(text).strip().casefold()

    value = re.sub(
        r"\s+",
        " ",
        value,
    )

    return value.strip()


# =========================================================
# VALIDATE INPUT
# =========================================================

def validate_input(
    state: QuizState,
) -> QuizState:

    topic = str(
        state.get("topic", "")
    ).strip()

    level = str(
        state.get("level", "")
    ).strip().lower()

    try:
        number_of_questions = int(
            state.get(
                "number_of_questions",
                0,
            )
        )

    except (
        TypeError,
        ValueError,
    ) as error:

        raise ValueError(
            "number_of_questions must be a valid integer."
        ) from error

    # -----------------------------------------------------
    # Topic
    # -----------------------------------------------------

    if not topic:
        raise ValueError(
            "Topic cannot be empty."
        )

    # -----------------------------------------------------
    # Question count
    # -----------------------------------------------------

    if number_of_questions < 1:
        raise ValueError(
            "Number of questions must be at least 1."
        )

    if number_of_questions > 20:
        raise ValueError(
            "Number of questions cannot exceed 20."
        )

    # -----------------------------------------------------
    # Level
    # -----------------------------------------------------

    try:
        LearningLevel(level)

    except ValueError as error:

        raise ValueError(
            f"Invalid learning level: {level}"
        ) from error

    # -----------------------------------------------------
    # Load memory
    # -----------------------------------------------------

    memory_key = get_memory_key(
        topic,
        level,
    )

    memory = QUIZ_MEMORY.get(
        memory_key,
        [],
    )

    previous_questions = memory[
        -MAX_PREVIOUS_QUESTIONS:
    ]

    return {
        **state,
        "topic": topic,
        "level": level,
        "number_of_questions": number_of_questions,
        "previous_questions": previous_questions,
        "response": None,
    }


# =========================================================
# BUILD PREVIOUS QUESTIONS PROMPT
# =========================================================

def build_previous_questions_prompt(
    previous_questions: list[str],
) -> str:

    if not previous_questions:

        return """
No previous questions are available.

Generate fresh questions covering different concepts.
"""

    formatted_questions = "\n".join(
        f"{index + 1}. {question}"
        for index, question in enumerate(
            previous_questions
        )
    )

    return f"""
Recently generated questions:

{formatted_questions}

Avoid repeating these questions.

Prefer different concepts and subtopics.
"""


# =========================================================
# NORMALIZE CORRECT ANSWER
# =========================================================

def normalize_correct_answer(
    question: QuizQuestion,
) -> Optional[str]:

    if not question.correct_answer:
        return None

    if not question.options:
        return None

    if len(question.options) != 4:
        return None

    answer = str(
        question.correct_answer
    ).strip()

    if not answer:
        return None

    # -----------------------------------------------------
    # Exact option match
    # -----------------------------------------------------

    for option in question.options:

        if (
            normalize_option_text(option)
            == normalize_option_text(answer)
        ):
            return option.strip()

    # -----------------------------------------------------
    # Clean answer
    # -----------------------------------------------------

    answer_key = (
        answer
        .replace("`", "")
        .replace("*", "")
        .strip()
        .casefold()
    )

    # -----------------------------------------------------
    # A / B / C / D
    # -----------------------------------------------------

    letter_map = {
        "a": 0,
        "b": 1,
        "c": 2,
        "d": 3,
    }

    if answer_key in letter_map:

        return question.options[
            letter_map[answer_key]
        ].strip()

    # -----------------------------------------------------
    # 1 / 2 / 3 / 4
    # -----------------------------------------------------

    number_map = {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 3,
    }

    if answer_key in number_map:

        return question.options[
            number_map[answer_key]
        ].strip()

    # -----------------------------------------------------
    # A. / A)
    # -----------------------------------------------------

    match = re.match(
        r"^([a-d])[\.\)](?:\s+.*)?$",
        answer_key,
        re.IGNORECASE,
    )

    if match:

        index = (
            ord(
                match.group(1).lower()
            )
            - ord("a")
        )

        return question.options[
            index
        ].strip()

    # -----------------------------------------------------
    # 1. / 1)
    # -----------------------------------------------------

    match = re.match(
        r"^([1-4])[\.\)](?:\s+.*)?$",
        answer_key,
    )

    if match:

        index = (
            int(
                match.group(1)
            )
            - 1
        )

        return question.options[
            index
        ].strip()

    # -----------------------------------------------------
    # Answer: A
    # Option B
    # Answer is C
    # -----------------------------------------------------

    letter_match = re.search(
        r"(?:answer|option)"
        r"\s*(?:is|=|:|-)?\s*"
        r"([a-d])\b",
        answer_key,
        re.IGNORECASE,
    )

    if letter_match:

        index = (
            ord(
                letter_match
                .group(1)
                .lower()
            )
            - ord("a")
        )

        return question.options[
            index
        ].strip()

    # -----------------------------------------------------
    # Answer: 1
    # Option 2
    # -----------------------------------------------------

    number_match = re.search(
        r"(?:answer|option)"
        r"\s*(?:is|=|:|-)?\s*"
        r"([1-4])\b",
        answer_key,
        re.IGNORECASE,
    )

    if number_match:

        index = (
            int(
                number_match.group(1)
            )
            - 1
        )

        return question.options[
            index
        ].strip()

    return None


# =========================================================
# VALIDATE SINGLE QUESTION
# =========================================================

def validate_single_question(
    question: QuizQuestion,
) -> Optional[QuizQuestion]:

    # -----------------------------------------------------
    # Question text
    # -----------------------------------------------------

    if not question.question:
        return None

    question_text = str(
        question.question
    ).strip()

    if not question_text:
        return None

    question.question = question_text

    # -----------------------------------------------------
    # Exactly 4 options
    # -----------------------------------------------------

    if not isinstance(
        question.options,
        list,
    ):
        return None

    if len(question.options) != 4:

        print(
            "SKIPPED - Expected exactly 4 options:"
        )

        print(
            question.question
        )

        return None

    # -----------------------------------------------------
    # Clean options
    # -----------------------------------------------------

    cleaned_options: list[str] = []

    for option in question.options:

        if option is None:
            return None

        cleaned = str(
            option
        ).strip()

        if not cleaned:
            return None

        cleaned_options.append(
            cleaned
        )

    # -----------------------------------------------------
    # Duplicate options
    # -----------------------------------------------------

    normalized_options = [
        normalize_option_text(option)
        for option in cleaned_options
    ]

    if len(
        set(normalized_options)
    ) != 4:

        print(
            "SKIPPED - Duplicate options:"
        )

        print(
            question.question
        )

        return None

    question.options = cleaned_options

    # -----------------------------------------------------
    # Correct answer
    # -----------------------------------------------------

    correct_option = (
        normalize_correct_answer(
            question
        )
    )

    if correct_option is None:

        print(
            "SKIPPED - Invalid correct answer:"
        )

        print(
            question.question
        )

        print(
            "LLM answer:",
            question.correct_answer,
        )

        return None

    question.correct_answer = (
        correct_option
    )

    # -----------------------------------------------------
    # Explanation
    # -----------------------------------------------------

    explanation = str(
        question.explanation or ""
    ).strip()

    if not explanation:

        explanation = (
            "This option is correct "
            "based on the concept tested "
            "in the question."
        )

    question.explanation = explanation

    return question


# =========================================================
# BUILD QUIZ PROMPT
# =========================================================

def build_quiz_prompt(
    topic: str,
    level: str,
    number_of_questions: int,
    previous_questions: list[str],
    current_questions: set[str],
    attempt: int,
) -> str:

    # -----------------------------------------------------
    # Previous questions
    # -----------------------------------------------------

    if (
        attempt
        < ALLOW_FALLBACK_AFTER_ATTEMPT
    ):

        previous_section = (
            build_previous_questions_prompt(
                previous_questions
            )
        )

    else:

        previous_section = """
Prefer fresh questions.

Do not waste time trying to avoid
every previous question.
"""

    # -----------------------------------------------------
    # Current questions
    # -----------------------------------------------------

    if current_questions:

        current_list = "\n".join(
            f"- {question}"
            for question in sorted(
                current_questions
            )
        )

        current_section = f"""
Already collected questions:

{current_list}

Do not repeat these questions.
"""

    else:

        current_section = """
No questions collected yet.
"""

    # -----------------------------------------------------
    # Prompt
    # -----------------------------------------------------

    return f"""
You are an expert multiple-choice quiz generator.

Generate EXACTLY {number_of_questions} questions.

TOPIC:
{topic}

LEVEL:
{level}

ATTEMPT:
{attempt}

{previous_section}

{current_section}

STRICT REQUIREMENTS:

1. Every question must be about {topic}.

2. Match the difficulty to {level}.

3. Generate exactly {number_of_questions} questions.

4. Every question must contain exactly 4 options.

5. All 4 options must be unique.

6. Each question must have exactly one correct answer.

7. correct_answer must be either:
   - exact option text
   - A
   - B
   - C
   - D

8. Include a SHORT explanation.

9. Cover different concepts and subtopics.

10. Avoid duplicate questions.

11. No introductory text.

12. Return ONLY structured data.

13. Do NOT return markdown.

14. Do NOT return JSON inside a string.

Generate the quiz now.
"""


# =========================================================
# GENERATE QUIZ
# =========================================================

def generate_quiz(
    state: QuizState,
) -> QuizState:

    topic = state["topic"]

    level = state["level"]

    required_count = (
        state["number_of_questions"]
    )

    previous_questions = state.get(
        "previous_questions",
        [],
    )

    # =====================================================
    # PREVIOUS NORMALIZED QUESTIONS
    # =====================================================

    previous_normalized = {
        normalize_question_text(
            question
        )
        for question in previous_questions
        if normalize_question_text(
            question
        )
    }

    # =====================================================
    # COLLECTION
    # =====================================================

    collected_questions: list[
        QuizQuestion
    ] = []

    collected_normalized: set[str] = set()

    # =====================================================
    # LLM
    # =====================================================

    llm = (
        OllamaService()
        .get_llm()
    )

    # =====================================================
    # STRUCTURED OUTPUT
    # =====================================================

    structured_llm = (
        llm.with_structured_output(
            QuizBatch
        )
    )

    # =====================================================
    # GENERATION LOOP
    # =====================================================

    for attempt in range(
        1,
        MAX_BATCH_ATTEMPTS + 1,
    ):

        remaining = (
            required_count
            - len(collected_questions)
        )

        if remaining <= 0:
            break

        # -------------------------------------------------
        # Request only what is needed
        # -------------------------------------------------

        batch_size = remaining

        print()
        print("=" * 60)

        print(
            f"Quiz generation "
            f"{attempt}/{MAX_BATCH_ATTEMPTS}"
        )

        print(
            f"Need: {remaining}"
        )

        print(
            f"Requesting: {batch_size}"
        )

        print("=" * 60)

        # -------------------------------------------------
        # Prompt
        # -------------------------------------------------

        prompt = build_quiz_prompt(
            topic=topic,
            level=level,
            number_of_questions=batch_size,
            previous_questions=previous_questions,
            current_questions=collected_normalized,
            attempt=attempt,
        )

        # -------------------------------------------------
        # LLM CALL
        # -------------------------------------------------

        try:

            batch_response = (
                structured_llm.invoke(
                    prompt
                )
            )

        except Exception as error:

            print(
                f"LLM ERROR "
                f"(attempt {attempt}):"
            )

            print(error)

            continue

        # -------------------------------------------------
        # Empty response
        # -------------------------------------------------

        if (
            batch_response is None
            or not batch_response.questions
        ):

            print(
                "No questions returned."
            )

            continue

        print(
            f"LLM returned "
            f"{len(batch_response.questions)} "
            f"questions."
        )

        # =================================================
        # PROCESS QUESTIONS
        # =================================================

        for question in (
            batch_response.questions
        ):

            # -------------------------------------------------
            # Validate
            # -------------------------------------------------

            valid_question = (
                validate_single_question(
                    question
                )
            )

            if valid_question is None:
                continue

            # -------------------------------------------------
            # Normalize question
            # -------------------------------------------------

            normalized = (
                normalize_question_text(
                    valid_question.question
                )
            )

            if not normalized:
                continue

            # -------------------------------------------------
            # Current quiz duplicate
            # -------------------------------------------------

            if (
                normalized
                in collected_normalized
            ):

                print(
                    "REMOVED CURRENT DUPLICATE:"
                )

                print(
                    valid_question.question
                )

                continue

            # -------------------------------------------------
            # Previous quiz duplicate
            # -------------------------------------------------

            if (
                normalized
                in previous_normalized
                and
                attempt
                < ALLOW_FALLBACK_AFTER_ATTEMPT
            ):

                print(
                    "REMOVED PREVIOUS DUPLICATE:"
                )

                print(
                    valid_question.question
                )

                continue

            # -------------------------------------------------
            # Assign temporary ID
            # -------------------------------------------------

            valid_question.id = (
                len(collected_questions)
                + 1
            )

            # -------------------------------------------------
            # Add question
            # -------------------------------------------------

            collected_questions.append(
                valid_question
            )

            collected_normalized.add(
                normalized
            )

            print(
                "ACCEPTED QUESTION:"
            )

            print(
                valid_question.question
            )

            print(
                "Correct answer:",
                valid_question.correct_answer,
            )

            print(
                f"Collected "
                f"{len(collected_questions)}/"
                f"{required_count}"
            )

            # -------------------------------------------------
            # Stop if enough
            # -------------------------------------------------

            if (
                len(collected_questions)
                >= required_count
            ):
                break

        # =====================================================
        # BATCH RESULT
        # =====================================================

        print()

        print(
            f"Collected "
            f"{len(collected_questions)}/"
            f"{required_count}"
        )

        if (
            len(collected_questions)
            >= required_count
        ):
            break

    # =====================================================
    # FINAL CHECK
    # =====================================================

    if (
        len(collected_questions)
        < required_count
    ):

        raise ValueError(
            f"Unable to generate enough questions. "
            f"Collected "
            f"{len(collected_questions)} "
            f"out of "
            f"{required_count}."
        )

    # =====================================================
    # EXACT COUNT
    # =====================================================

    collected_questions = (
        collected_questions[
            :required_count
        ]
    )

    # =====================================================
    # FINAL IDs
    # =====================================================

    for index, question in enumerate(
        collected_questions,
        start=1,
    ):

        question.id = index

    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    final_response = QuizResponse(
        topic=topic,
        level=LearningLevel(level),
        questions=collected_questions,
    )

    return {
        **state,
        "response": final_response,
    }


# =========================================================
# VALIDATE OUTPUT
# =========================================================

def validate_output(
    state: QuizState,
) -> QuizState:

    response = state.get(
        "response"
    )

    if response is None:

        raise ValueError(
            "Quiz agent did not return a response."
        )

    expected_count = (
        state["number_of_questions"]
    )

    # -----------------------------------------------------
    # Count
    # -----------------------------------------------------

    if (
        len(response.questions)
        != expected_count
    ):

        raise ValueError(
            f"Expected "
            f"{expected_count} questions "
            f"but received "
            f"{len(response.questions)}."
        )

    final_questions: list[
        QuizQuestion
    ] = []

    seen_questions: set[str] = set()

    # -----------------------------------------------------
    # Validate every question
    # -----------------------------------------------------

    for index, question in enumerate(
        response.questions,
        start=1,
    ):

        valid_question = (
            validate_single_question(
                question
            )
        )

        if valid_question is None:

            raise ValueError(
                f"Final validation failed "
                f"for question {index}."
            )

        normalized = (
            normalize_question_text(
                valid_question.question
            )
        )

        # -------------------------------------------------
        # Duplicate
        # -------------------------------------------------

        if normalized in seen_questions:

            raise ValueError(
                "Duplicate question detected: "
                f"{valid_question.question}"
            )

        seen_questions.add(
            normalized
        )

        valid_question.id = index

        final_questions.append(
            valid_question
        )

    # -----------------------------------------------------
    # Final response
    # -----------------------------------------------------

    validated_response = QuizResponse(
        topic=response.topic,
        level=response.level,
        questions=final_questions,
    )

    return {
        **state,
        "response": validated_response,
    }


# =========================================================
# SAVE QUIZ TO MEMORY
# =========================================================

def save_quiz_to_memory(
    state: QuizState,
) -> QuizState:

    response = state.get(
        "response"
    )

    if response is None:
        return state

    memory_key = get_memory_key(
        state["topic"],
        state["level"],
    )

    # -----------------------------------------------------
    # Initialize
    # -----------------------------------------------------

    if memory_key not in QUIZ_MEMORY:

        QUIZ_MEMORY[
            memory_key
        ] = []

    memory = QUIZ_MEMORY[
        memory_key
    ]

    # -----------------------------------------------------
    # Existing normalized questions
    # -----------------------------------------------------

    existing_normalized = {
        normalize_question_text(
            question
        )
        for question in memory
        if normalize_question_text(
            question
        )
    }

    # -----------------------------------------------------
    # Add new questions
    # -----------------------------------------------------

    for question in response.questions:

        normalized = (
            normalize_question_text(
                question.question
            )
        )

        if (
            normalized
            and
            normalized
            not in existing_normalized
        ):

            memory.append(
                question.question.strip()
            )

            existing_normalized.add(
                normalized
            )

    # -----------------------------------------------------
    # Keep recent questions only
    # -----------------------------------------------------

    QUIZ_MEMORY[
        memory_key
    ] = memory[
        -MAX_PREVIOUS_QUESTIONS:
    ]

    print()

    print(
        "QUIZ MEMORY SAVED:"
    )

    print(
        memory_key
    )

    print(
        f"Stored questions: "
        f"{len(QUIZ_MEMORY[memory_key])}"
    )

    return state


# =========================================================
# BUILD LANGGRAPH
# =========================================================

def build_quiz_graph():

    graph = StateGraph(
        QuizState
    )

    # -----------------------------------------------------
    # Nodes
    # -----------------------------------------------------

    graph.add_node(
        "validate_input",
        validate_input,
    )

    graph.add_node(
        "generate_quiz",
        generate_quiz,
    )

    graph.add_node(
        "validate_output",
        validate_output,
    )

    graph.add_node(
        "save_quiz_to_memory",
        save_quiz_to_memory,
    )

    # -----------------------------------------------------
    # START
    # -----------------------------------------------------

    graph.add_edge(
        START,
        "validate_input",
    )

    # -----------------------------------------------------
    # Validate -> Generate
    # -----------------------------------------------------

    graph.add_edge(
        "validate_input",
        "generate_quiz",
    )

    # -----------------------------------------------------
    # Generate -> Validate
    # -----------------------------------------------------

    graph.add_edge(
        "generate_quiz",
        "validate_output",
    )

    # -----------------------------------------------------
    # Validate -> Memory
    # -----------------------------------------------------

    graph.add_edge(
        "validate_output",
        "save_quiz_to_memory",
    )

    # -----------------------------------------------------
    # Memory -> END
    # -----------------------------------------------------

    graph.add_edge(
        "save_quiz_to_memory",
        END,
    )

    # -----------------------------------------------------
    # Compile
    # -----------------------------------------------------

    return graph.compile()