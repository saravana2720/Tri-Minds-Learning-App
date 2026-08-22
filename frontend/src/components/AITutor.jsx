import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  User,
  LoaderCircle,
  Trash2,
  Sparkles,
  BookOpen,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/v1/tutor";

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I'm your AI Tutor 👋\n\nAsk me anything about AI, Machine Learning, Python, Deep Learning, or any topic you're learning.",
};

function AITutor() {
  const [topic, setTopic] = useState("Machine Learning");
  const [level, setLevel] = useState("beginner");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    INITIAL_MESSAGE,
  ]);

  const chatEndRef = useRef(null);

  /* =====================================================
     AUTO SCROLL
  ===================================================== */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* =====================================================
     CLEAR CHAT
  ===================================================== */

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  /* =====================================================
     FORMAT BACKEND RESPONSE
  ===================================================== */

  const formatTutorResponse = (data) => {
    const sections = [];

    if (data.definition) {
      sections.push(
        `📘 Definition\n${data.definition}`
      );
    }

    if (data.explanation) {
      sections.push(
        `💡 Explanation\n${data.explanation}`
      );
    }

    if (data.intuition) {
      sections.push(
        `🧠 Intuition\n${data.intuition}`
      );
    }

    if (data.real_world_example) {
      sections.push(
        `🌍 Real-World Example\n${data.real_world_example}`
      );
    }

    if (data.code) {
      sections.push(
        `💻 Code Example\n${data.code}`
      );
    }

    if (data.code_explanation) {
      sections.push(
        `🔍 Code Explanation\n${data.code_explanation}`
      );
    }

    if (data.common_mistakes) {
      const mistakes = Array.isArray(data.common_mistakes)
        ? data.common_mistakes
            .map((item) => `• ${item}`)
            .join("\n")
        : data.common_mistakes;

      sections.push(
        `⚠️ Common Mistakes\n${mistakes}`
      );
    }

    if (data.when_to_use) {
      sections.push(
        `✅ When to Use\n${data.when_to_use}`
      );
    }

    if (data.when_not_to_use) {
      sections.push(
        `🚫 When Not to Use\n${data.when_not_to_use}`
      );
    }

    if (data.summary) {
      sections.push(
        `📝 Summary\n${data.summary}`
      );
    }

    if (data.follow_up_question) {
      sections.push(
        `❓ Follow-up\n${data.follow_up_question}`
      );
    }

    return sections.join("\n\n");
  };

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      console.log("=================================");
      console.log("AI TUTOR REQUEST");
      console.log("=================================");
      console.log("URL:", API_URL);
      console.log("Topic:", topic);
      console.log("Level:", level);
      console.log("Question:", userMessage);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim() || "General Learning",
          level: level,
          question: userMessage,
        }),
      });

      console.log("HTTP STATUS:", response.status);

      const rawText = await response.text();

      console.log("RAW BACKEND RESPONSE:");
      console.log(rawText);

      let data;

      try {
        data = JSON.parse(rawText);
      } catch (error) {
        throw new Error(
          `Backend returned invalid JSON:\n${rawText}`
        );
      }

      console.log("PARSED BACKEND DATA:");
      console.log(data);

      /* ================================================
         BACKEND ERROR
      ================================================= */

      if (!response.ok) {
        let backendError = "Tutor request failed.";

        if (Array.isArray(data?.detail)) {
          backendError = data.detail
            .map((item) => item.msg)
            .join(", ");
        } else if (typeof data?.detail === "string") {
          backendError = data.detail;
        } else if (data?.message) {
          backendError = data.message;
        }

        throw new Error(backendError);
      }

      /* ================================================
         FORMAT TUTOR RESPONSE
      ================================================= */

      const answer = formatTutorResponse(data);

      console.log("FORMATTED AI ANSWER:");
      console.log(answer);

      if (!answer.trim()) {
        console.error(
          "Backend returned data, but no tutor fields were found:"
        );

        console.error(data);

        throw new Error(
          "AI Tutor returned an empty response. Check the backend TutorResponse."
        );
      }

      /* ================================================
         ADD AI RESPONSE
      ================================================= */

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      console.error("=================================");
      console.error("AI TUTOR ERROR");
      console.error("=================================");
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          error: true,
          content:
            error?.message ||
            "Unable to connect to AI Tutor.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     ENTER KEY
  ===================================================== */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="tutor-page">

      {/* PAGE HEADER */}

      <section className="tutor-header">

        <p className="welcome-label">
          AI LEARNING PLATFORM
        </p>

        <h1>
          AI Tutor 🤖
        </h1>

        <p className="welcome-text">
          Ask questions and get personalized explanations
          from your AI Tutor.
        </p>

      </section>

      {/* TUTOR CONTAINER */}

      <section className="tutor-container">

        {/* TOP HEADER */}

        <div className="tutor-top">

          <div className="tutor-title">

            <div className="tutor-avatar">
              <Bot size={23} />
            </div>

            <div>

              <span className="card-label">
                PERSONAL AI ASSISTANT
              </span>

              <h2>
                AI Tutor
              </h2>

              <p className="tutor-subtitle">
                Your personal learning assistant
              </p>

            </div>

          </div>

          <div className="tutor-actions">

            <div className="ai-status">
              <span className="status-dot" />
              Online
            </div>

            <button
              type="button"
              className="clear-button"
              onClick={clearChat}
              disabled={loading}
            >
              <Trash2 size={15} />
              Clear
            </button>

          </div>

        </div>

        {/* TOPIC + LEVEL */}

        <div className="tutor-settings">

          <div className="tutor-field">

            <label htmlFor="tutor-topic">
              <BookOpen size={16} />
              Topic
            </label>

            <input
              id="tutor-topic"
              type="text"
              value={topic}
              onChange={(e) =>
                setTopic(e.target.value)
              }
              placeholder="Enter learning topic"
            />

          </div>

          <div className="tutor-field">

            <label htmlFor="tutor-level">
              <Sparkles size={16} />
              Level
            </label>

            <select
              id="tutor-level"
              value={level}
              onChange={(e) =>
                setLevel(e.target.value)
              }
            >
              <option value="beginner">
                Beginner
              </option>

              <option value="intermediate">
                Intermediate
              </option>

              <option value="advanced">
                Advanced
              </option>
            </select>

          </div>

        </div>

        {/* CHAT */}

        <div className="chat-container">

          {messages.map((msg, index) => (

            <div
              key={index}
              className={`chat-message ${
                msg.role === "user"
                  ? "user"
                  : "assistant"
              }`}
            >

              <div className="message-avatar">

                {msg.role === "user" ? (
                  <User size={17} />
                ) : (
                  <Bot size={17} />
                )}

              </div>

              <div
                className={`message-content ${
                  msg.error
                    ? "message-error"
                    : ""
                }`}
              >
                {msg.content}
              </div>

            </div>

          ))}

          {/* LOADING */}

          {loading && (

            <div className="chat-message assistant">

              <div className="message-avatar">
                <Bot size={17} />
              </div>

              <div className="message-content typing">

                <LoaderCircle
                  size={16}
                  className="loading-icon"
                />

                AI Tutor is thinking...

              </div>

            </div>

          )}

          <div ref={chatEndRef} />

        </div>

        {/* INPUT */}

        <div className="chat-input-container">

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI Tutor anything..."
            rows={1}
            disabled={loading}
          />

          <button
            type="button"
            className="send-button"
            onClick={sendMessage}
            disabled={
              loading ||
              !message.trim()
            }
          >
            {loading ? (
              <LoaderCircle
                size={19}
                className="loading-icon"
              />
            ) : (
              <Send size={19} />
            )}
          </button>

        </div>

        <p className="chat-hint">
          Press Enter to send • Shift + Enter for new line
        </p>

      </section>

    </main>
  );
}

export default AITutor;