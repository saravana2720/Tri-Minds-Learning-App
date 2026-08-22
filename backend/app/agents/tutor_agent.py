from typing import Optional

from typing_extensions import TypedDict

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

from app.schemas.tutor import LearningLevel


# =========================================================
# TUTOR STATE
# =========================================================

class TutorState(TypedDict):
    topic: str
    level: LearningLevel
    question: str
    response: Optional[dict]


# =========================================================
# OLLAMA MODEL
# =========================================================

llm = ChatOllama(
    model="llama3.2",
    temperature=0.3,
)


# =========================================================
# TUTOR NODE
# =========================================================

def generate_tutor_response(
    state: TutorState,
) -> TutorState:

    topic = state["topic"]
    level = state["level"]
    question = state["question"]

    prompt = f"""
You are an expert AI Tutor.

Your job is to teach the student clearly and simply.

Student learning level:
{level.value}

Learning topic:
{topic}

Student question:
{question}

Return your answer using EXACTLY this structure:

Definition:
A simple definition of the concept.

Explanation:
A detailed but easy-to-understand explanation.

Intuition:
Explain the idea using a simple analogy.

Real World Example:
Give a practical real-world example.

Code:
Provide a simple Python example if code is relevant.
Otherwise write "No code required."

Code Explanation:
Explain the code line by line.

Common Mistakes:
Give 3 common mistakes students make.

When To Use:
Explain when this concept should be used.

When Not To Use:
Explain when this concept should not be used.

Summary:
Give a short summary.

Follow Up Question:
Ask one useful question to continue learning.

Important:
- Answer the student's QUESTION, not just the topic.
- Keep the explanation appropriate for the student's level.
- Do not invent unnecessary information.
- Use simple language.
"""

    # -----------------------------------------------------
    # CALL OLLAMA
    # -----------------------------------------------------

    result = llm.invoke(
        [
            SystemMessage(
                content=(
                    "You are a helpful and patient "
                    "AI Data Science Tutor."
                )
            ),
            HumanMessage(content=prompt),
        ]
    )

    content = result.content

    # -----------------------------------------------------
    # TEMPORARY PARSER
    # -----------------------------------------------------

    sections = {
        "definition": "",
        "explanation": "",
        "intuition": "",
        "real_world_example": "",
        "code": "",
        "code_explanation": "",
        "common_mistakes": [],
        "when_to_use": "",
        "when_not_to_use": "",
        "summary": "",
        "follow_up_question": "",
    }

    current_section = None

    section_mapping = {
        "Definition:": "definition",
        "Explanation:": "explanation",
        "Intuition:": "intuition",
        "Real World Example:": "real_world_example",
        "Code:": "code",
        "Code Explanation:": "code_explanation",
        "Common Mistakes:": "common_mistakes",
        "When To Use:": "when_to_use",
        "When Not To Use:": "when_not_to_use",
        "Summary:": "summary",
        "Follow Up Question:": "follow_up_question",
    }

    for raw_line in content.splitlines():

        line = raw_line.strip()

        if not line:
            continue

        matched_section = False

        for heading, key in section_mapping.items():

            if line.lower().startswith(heading.lower()):

                current_section = key
                matched_section = True

                remaining = line[len(heading):].strip()

                if remaining:

                    if key == "common_mistakes":
                        sections[key].append(remaining)
                    else:
                        sections[key] = remaining

                break

        if matched_section:
            continue

        if current_section is None:
            continue

        if current_section == "common_mistakes":

            cleaned = line.lstrip("-*• ")

            if cleaned:
                sections[current_section].append(cleaned)

        else:

            if sections[current_section]:

                sections[current_section] += (
                    "\n" + line
                )

            else:

                sections[current_section] = line

    # -----------------------------------------------------
    # FALLBACKS
    # -----------------------------------------------------

    if not sections["definition"]:
        sections["definition"] = (
            f"{topic} is an important concept "
            f"in data science and machine learning."
        )

    if not sections["explanation"]:
        sections["explanation"] = content

    if not sections["intuition"]:
        sections["intuition"] = (
            "Think about the concept using a simple "
            "real-world analogy."
        )

    if not sections["real_world_example"]:
        sections["real_world_example"] = (
            "This concept can be applied to "
            "real-world data science problems."
        )

    if not sections["code"]:
        sections["code"] = "No code required."

    if not sections["code_explanation"]:
        sections["code_explanation"] = (
            "The example demonstrates the main idea."
        )

    if not sections["common_mistakes"]:
        sections["common_mistakes"] = [
            "Trying to memorize the concept.",
            "Not understanding the underlying idea.",
            "Not practicing with real examples.",
        ]

    if not sections["when_to_use"]:
        sections["when_to_use"] = (
            f"Use {topic} when it is appropriate "
            "for the problem you are solving."
        )

    if not sections["when_not_to_use"]:
        sections["when_not_to_use"] = (
            f"Do not use {topic} when another "
            "approach is more suitable."
        )

    if not sections["summary"]:
        sections["summary"] = (
            f"In summary, {topic} is an important "
            f"concept to understand at the "
            f"{level.value} level."
        )

    if not sections["follow_up_question"]:
        sections["follow_up_question"] = (
            f"Would you like me to explain "
            f"{topic} with another example?"
        )

    # -----------------------------------------------------
    # FINAL RESPONSE
    # -----------------------------------------------------

    response = {
        "topic": topic,
        "level": level,

        "definition": sections["definition"],
        "explanation": sections["explanation"],
        "intuition": sections["intuition"],
        "real_world_example": sections["real_world_example"],
        "code": sections["code"],
        "code_explanation": sections["code_explanation"],
        "common_mistakes": sections["common_mistakes"],
        "when_to_use": sections["when_to_use"],
        "when_not_to_use": sections["when_not_to_use"],
        "summary": sections["summary"],
        "follow_up_question": sections["follow_up_question"],
    }

    return {
        **state,
        "response": response,
    }


# =========================================================
# BUILD LANGGRAPH
# =========================================================

def build_tutor_graph():

    from langgraph.graph import END, START, StateGraph

    graph = StateGraph(TutorState)

    graph.add_node(
        "generate_tutor_response",
        generate_tutor_response,
    )

    graph.add_edge(
        START,
        "generate_tutor_response",
    )

    graph.add_edge(
        "generate_tutor_response",
        END,
    )

    return graph.compile()