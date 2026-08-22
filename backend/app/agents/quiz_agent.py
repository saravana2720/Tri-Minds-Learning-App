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
#
# Store questions in a LIST, not a SET.
#
# Why?
# - List preserves insertion order.
# - We can safely keep only the latest questions.
# - Duplicate checking is done separately using normalization.
# =========================================================

QUIZ_MEMORY: dict[str, list[str]] = {}


# =========================================================
# CONFIGURATION
# =========================================================

MAX_BATCH_ATTEMPTS = 8

MAX_PREVIOUS_QUESTIONS = 12

# After this many failed attempts, allow exact old questions
# instead of failing forever.
ALLOW_FALLBACK_AFTER_ATTEMPT = 5


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

class QuizBatch(BaseModel):
    topic: str = ""
    level: str = ""
    questions: list[QuizQuestion] = Field(
        default_factory=list
    )


# =========================================================
# VERIFIER RESPONSE
# =========================================================

class QuizVerification(BaseModel):
    correct_answer: str


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

    # Remove common numbering:
    # 1. Question
    # Q1. Question
    # Question 1:
    text = re.sub(
        r"^(?:q(?:uestion)?\s*)?\d+\s*[\.\):\-]\s*",
        "",
        text,
    )

    # Replace punctuation with spaces
    text = re.sub(
        r"""[?"'.,!;:\-_()\[\]{}\\/]+""",
        " ",
        text,
    )

    # Normalize whitespace
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
    # Topic validation
    # -----------------------------------------------------

    if not topic:

        raise ValueError(
            "Topic cannot be empty."
        )

    # -----------------------------------------------------
    # Question count validation
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
    # Level validation
    # -----------------------------------------------------

    try:

        LearningLevel(level)

    except ValueError as error:

        raise ValueError(
            f"Invalid learning level: {level}"
        ) from error

    # -----------------------------------------------------
    # Load previous memory
    #
    # IMPORTANT:
    # Use only recent memory.
    # =====================================================

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
There are no previous questions.

Generate fresh questions from different subtopics.
"""

    formatted_questions = "\n".join(
        f"{index + 1}. {question}"
        for index, question in enumerate(
            previous_questions
        )
    )

    return f"""
These questions were recently generated:

{formatted_questions}

Try to avoid repeating them.

IMPORTANT:
- Prefer different concepts.
- Prefer different subtopics.
- Avoid exact duplicates.
- Avoid very similar wording.
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
            ==
            normalize_option_text(answer)
        ):

            return option.strip()

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
    # A. Answer / A) Answer
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
    # 1. Answer / 1) Answer
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
    # Answer is 3
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
# NORMALIZE VERIFIER ANSWER
# =========================================================

def normalize_verifier_answer(
    answer: str,
    options: list[str],
) -> Optional[str]:

    if not answer:
        return None

    if len(options) != 4:
        return None

    answer_text = str(
        answer
    ).strip()

    if not answer_text:
        return None

    answer_key = (
        answer_text
        .replace("`", "")
        .replace("*", "")
        .strip()
        .casefold()
    )

    # -----------------------------------------------------
    # Direct option text
    # -----------------------------------------------------

    for option in options:

        if (
            normalize_option_text(option)
            ==
            normalize_option_text(answer_text)
        ):

            return option.strip()

    # -----------------------------------------------------
    # A / B / C / D
    # -----------------------------------------------------

    if answer_key in {
        "a",
        "b",
        "c",
        "d",
    }:

        index = (
            ord(answer_key)
            - ord("a")
        )

        return options[index].strip()

    # -----------------------------------------------------
    # 1 / 2 / 3 / 4
    # -----------------------------------------------------

    if answer_key in {
        "1",
        "2",
        "3",
        "4",
    }:

        index = (
            int(answer_key)
            - 1
        )

        return options[index].strip()

    # -----------------------------------------------------
    # A. / A)
    # -----------------------------------------------------

    letter_match = re.match(
        r"^([a-d])[\.\)]",
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

        return options[index].strip()

    # -----------------------------------------------------
    # 1. / 1)
    # -----------------------------------------------------

    number_match = re.match(
        r"^([1-4])[\.\)]",
        answer_key,
    )

    if number_match:

        index = (
            int(
                number_match.group(1)
            )
            - 1
        )

        return options[index].strip()

    # -----------------------------------------------------
    # Answer: A / Option B
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

        return options[index].strip()

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

        return options[index].strip()

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
    # Exactly four options
    # -----------------------------------------------------

    if not isinstance(
        question.options,
        list,
    ):

        return None

    if len(question.options) != 4:

        print(
            "SKIPPED QUESTION - "
            "Expected exactly 4 options:"
        )

        print(question.question)

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

    if (
        len(set(normalized_options))
        != 4
    ):

        print(
            "SKIPPED QUESTION - "
            "Duplicate options:"
        )

        print(question.question)

        return None

    question.options = cleaned_options

    # -----------------------------------------------------
    # Normalize correct answer
    # -----------------------------------------------------

    correct_option = (
        normalize_correct_answer(
            question
        )
    )

    if correct_option is None:

        print(
            "SKIPPED QUESTION - "
            "Invalid correct answer:"
        )

        print(question.question)

        print(
            "LLM correct answer:",
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
        question.explanation
        or ""
    ).strip()

    if not explanation:

        explanation = (
            "This option is correct "
            "based on the concept "
            "tested in the question."
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

    # =====================================================
    # IMPORTANT FALLBACK
    #
    # For first few attempts, avoid previous questions.
    #
    # After several failures, stop sending the huge
    # "do not repeat" restriction. This prevents the model
    # from getting stuck generating nothing useful.
    # =====================================================

    if (
        attempt
        <
        ALLOW_FALLBACK_AFTER_ATTEMPT
    ):

        previous_section = (
            build_previous_questions_prompt(
                previous_questions
            )
        )

    else:

        previous_section = """
You have already generated quizzes before.

Prefer fresh concepts, but prioritize generating
valid, high-quality questions.

Do not get stuck trying to avoid every old question.
"""

    # =====================================================
    # Current questions
    # =====================================================

    if current_questions:

        current_list = "\n".join(
            f"- {question}"
            for question in sorted(
                current_questions
            )
        )

        current_section = f"""
Questions already collected in the CURRENT quiz:

{current_list}

Do not repeat these exact questions.
"""

    else:

        current_section = """
No questions have been collected yet
for the current quiz.
"""

    return f"""
You are an expert quiz generator.

Generate EXACTLY {number_of_questions}
multiple-choice questions.

TOPIC:
{topic}

LEVEL:
{level}

GENERATION ATTEMPT:
{attempt}

RECENT PREVIOUS QUESTIONS:
{previous_section}

CURRENT QUIZ QUESTIONS:
{current_section}

STRICT REQUIREMENTS:

1. Every question must be about {topic}.

2. Difficulty must match {level}.

3. Generate exactly {number_of_questions} questions.

4. Every question must contain exactly 4 options.

5. All 4 options must be unique.

6. Each question must have one correct answer.

7. correct_answer MUST be one of:
   - exact option text
   - A
   - B
   - C
   - D

8. Include a short explanation.

9. Questions should cover different concepts.

10. Avoid exact duplicate questions inside
    the current quiz.

11. Do not generate introductory text.

12. Return only the structured data required
    by the schema.

Generate the quiz now.
"""


# =========================================================
# BUILD VERIFIER PROMPT
# =========================================================

def build_verifier_prompt(
    question: QuizQuestion,
) -> str:

    options_text = "\n".join(
        [
            f"A. {question.options[0]}",
            f"B. {question.options[1]}",
            f"C. {question.options[2]}",
            f"D. {question.options[3]}",
        ]
    )

    return f"""
You are a multiple-choice answer verifier.

QUESTION:

{question.question}

OPTIONS:

{options_text}

Determine the single correct option.

Return ONLY one letter:

A
B
C
or
D
"""


# =========================================================
# SEMANTIC VERIFY QUESTION
# =========================================================

def semantic_verify_question(
    question: QuizQuestion,
    llm,
) -> Optional[QuizQuestion]:

    if len(question.options) != 4:

        return None

    verifier_prompt = (
        build_verifier_prompt(
            question
        )
    )

    try:

        structured_verifier = (
            llm.with_structured_output(
                QuizVerification
            )
        )

        verification = (
            structured_verifier.invoke(
                verifier_prompt
            )
        )

    except Exception as error:

        # IMPORTANT:
        # Do not reject a perfectly valid generated question
        # only because the verifier failed.
        #
        # Fall back to the already normalized answer.
        print(
            "VERIFIER ERROR - "
            "Using original answer:"
        )

        print(error)

        return question

    if verification is None:

        print(
            "VERIFIER RETURNED NOTHING - "
            "Using original answer."
        )

        return question

    verifier_answer = (
        verification.correct_answer
    )

    normalized_answer = (
        normalize_verifier_answer(
            verifier_answer,
            question.options,
        )
    )

    if normalized_answer is None:

        print(
            "VERIFIER INVALID ANSWER - "
            "Using original answer."
        )

        print(
            "Verifier answer:",
            verifier_answer,
        )

        return question

    print(
        "Verifier answer:",
        verifier_answer,
    )

    print(
        "Normalized verifier answer:",
        normalized_answer,
    )

    question.correct_answer = (
        normalized_answer
    )

    return question


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

    previous_questions = (
        state.get(
            "previous_questions",
            [],
        )
    )

    # =====================================================
    # NORMALIZED PREVIOUS QUESTIONS
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
    # GENERATION LOOP
    # =====================================================

    for attempt in range(
        1,
        MAX_BATCH_ATTEMPTS + 1,
    ):

        remaining = (
            required_count
            -
            len(collected_questions)
        )

        if remaining <= 0:

            break

        # -------------------------------------------------
        # Ask for extra questions
        #
        # If we need 5, request 8.
        # This gives room for duplicates/invalid questions.
        # -------------------------------------------------

        batch_size = min(
            max(
                remaining + 3,
                5,
            ),
            10,
        )

        print()

        print(
            "=" * 60
        )

        print(
            f"Generating quiz batch... "
            f"Attempt {attempt}/"
            f"{MAX_BATCH_ATTEMPTS}"
        )

        print(
            f"Need {remaining} more questions."
        )

        print(
            f"Requesting {batch_size}."
        )

        print(
            "=" * 60
        )

        # -------------------------------------------------
        # Build prompt
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
        # Structured output
        # -------------------------------------------------

        structured_llm = (
            llm.with_structured_output(
                QuizBatch
            )
        )

        # -------------------------------------------------
        # Call LLM
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
            or
            not batch_response.questions
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
            # Basic validation
            # -------------------------------------------------

            valid_question = (
                validate_single_question(
                    question
                )
            )

            if valid_question is None:

                continue

            normalized = (
                normalize_question_text(
                    valid_question.question
                )
            )

            if not normalized:

                continue

            # -------------------------------------------------
            # CURRENT QUIZ DUPLICATE
            #
            # Always reject duplicates inside the same quiz.
            # -------------------------------------------------

            if (
                normalized
                in collected_normalized
            ):

                print(
                    "REMOVED CURRENT QUIZ DUPLICATE:"
                )

                print(
                    valid_question.question
                )

                continue

            # -------------------------------------------------
            # PREVIOUS QUIZ DUPLICATE
            #
            # Reject only during early attempts.
            #
            # After repeated failures, allow the question
            # so the API does not fail forever.
            # -------------------------------------------------

            if (
                normalized
                in previous_normalized
                and
                attempt
                <
                ALLOW_FALLBACK_AFTER_ATTEMPT
            ):

                print(
                    "REMOVED PREVIOUS QUIZ DUPLICATE:"
                )

                print(
                    valid_question.question
                )

                continue

            # -------------------------------------------------
            # Semantic verification
            # -------------------------------------------------

            verified_question = (
                semantic_verify_question(
                    valid_question,
                    llm,
                )
            )

            if verified_question is None:

                print(
                    "SKIPPED QUESTION "
                    "AFTER VERIFICATION:"
                )

                print(
                    valid_question.question
                )

                continue

            # -------------------------------------------------
            # Final answer normalization
            # -------------------------------------------------

            final_answer = (
                normalize_verifier_answer(
                    verified_question.correct_answer,
                    verified_question.options,
                )
            )

            # If verifier output is weird,
            # normalize using original answer logic.
            if final_answer is None:

                final_answer = (
                    normalize_correct_answer(
                        verified_question
                    )
                )

            if final_answer is None:

                print(
                    "SKIPPED QUESTION - "
                    "Unable to normalize answer."
                )

                print(
                    verified_question.question
                )

                continue

            verified_question.correct_answer = (
                final_answer
            )

            # -------------------------------------------------
            # Temporary ID
            # -------------------------------------------------

            verified_question.id = (
                len(collected_questions)
                + 1
            )

            # -------------------------------------------------
            # Add question
            # -------------------------------------------------

            collected_questions.append(
                verified_question
            )

            collected_normalized.add(
                normalized
            )

            print(
                "ACCEPTED QUESTION:"
            )

            print(
                verified_question.question
            )

            print(
                "Correct answer:",
                verified_question.correct_answer,
            )

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
        # RESULT
        # =====================================================

        print()

        print(
            f"Collected "
            f"{len(collected_questions)}/"
            f"{required_count} "
            f"valid questions."
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

    if (
        len(response.questions)
        !=
        expected_count
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

        if (
            normalized
            in seen_questions
        ):

            raise ValueError(
                "Duplicate question detected "
                f"at final validation: "
                f"{valid_question.question}"
            )

        seen_questions.add(
            normalized
        )

        valid_question.id = index

        final_questions.append(
            valid_question
        )

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
    # Initialize memory
    # -----------------------------------------------------

    if memory_key not in QUIZ_MEMORY:

        QUIZ_MEMORY[
            memory_key
        ] = []

    memory = QUIZ_MEMORY[
        memory_key
    ]

    existing_normalized = {
        normalize_question_text(
            question
        )
        for question in memory
    }

    # -----------------------------------------------------
    # Add only new questions
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
    # Keep only latest questions
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
    # VALIDATE -> GENERATE
    # -----------------------------------------------------

    graph.add_edge(
        "validate_input",
        "generate_quiz",
    )

    # -----------------------------------------------------
    # GENERATE -> VALIDATE
    # -----------------------------------------------------

    graph.add_edge(
        "generate_quiz",
        "validate_output",
    )

    # -----------------------------------------------------
    # VALIDATE -> MEMORY
    # -----------------------------------------------------

    graph.add_edge(
        "validate_output",
        "save_quiz_to_memory",
    )

    # -----------------------------------------------------
    # MEMORY -> END
    # -----------------------------------------------------

    graph.add_edge(
        "save_quiz_to_memory",
        END,
    )

    return graph.compile()