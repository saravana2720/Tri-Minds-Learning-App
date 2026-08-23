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

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://gather-restaurant-advertisements-brooks.trycloudflare.com"
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/api/v1/tutor`;

// =====================================================
// INITIAL MESSAGE
// =====================================================

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I'm your AI Tutor 👋\n\nAsk me anything about AI, Machine Learning, Python, Deep Learning, or any topic you're learning.",
};

// =====================================================
// COMPONENT
// =====================================================

function AITutor() {
  // ===================================================
  // FORM STATE
  // ===================================================

  const [topic, setTopic] = useState(
    "Machine Learning"
  );

  const [level, setLevel] = useState(
    "beginner"
  );

  const [message, setMessage] = useState("");

  // ===================================================
  // UI STATE
  // ===================================================

  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    INITIAL_MESSAGE,
  ]);

  // ===================================================
  // CHAT END REF
  // ===================================================

  const chatEndRef = useRef(null);

  // ===================================================
  // AUTO SCROLL
  // ===================================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ===================================================
  // CLEAR CHAT
  // ===================================================

  const clearChat = () => {
    if (loading) {
      return;
    }

    setMessages([
      INITIAL_MESSAGE,
    ]);

    setMessage("");
  };

  // ===================================================
  // FORMAT BACKEND RESPONSE
  // ===================================================

  const formatTutorResponse = (data) => {
    const sections = [];

    if (data?.definition) {
      sections.push(
        `📘 Definition\n${data.definition}`
      );
    }

    if (data?.explanation) {
      sections.push(
        `💡 Explanation\n${data.explanation}`
      );
    }

    if (data?.intuition) {
      sections.push(
        `🧠 Intuition\n${data.intuition}`
      );
    }

    if (data?.real_world_example) {
      sections.push(
        `🌍 Real-World Example\n${data.real_world_example}`
      );
    }

    if (data?.code) {
      sections.push(
        `💻 Code Example\n${data.code}`
      );
    }

    if (data?.code_explanation) {
      sections.push(
        `🔍 Code Explanation\n${data.code_explanation}`
      );
    }

    if (data?.common_mistakes) {
      const mistakes = Array.isArray(
        data.common_mistakes
      )
        ? data.common_mistakes
            .map(
              (item) => `• ${item}`
            )
            .join("\n")
        : String(
            data.common_mistakes
          );

      sections.push(
        `⚠️ Common Mistakes\n${mistakes}`
      );
    }

    if (data?.when_to_use) {
      sections.push(
        `✅ When to Use\n${data.when_to_use}`
      );
    }

    if (data?.when_not_to_use) {
      sections.push(
        `🚫 When Not to Use\n${data.when_not_to_use}`
      );
    }

    if (data?.summary) {
      sections.push(
        `📝 Summary\n${data.summary}`
      );
    }

    if (data?.follow_up_question) {
      sections.push(
        `❓ Follow-up\n${data.follow_up_question}`
      );
    }

    // =================================================
    // FALLBACK RESPONSES
    // =================================================

    if (
      sections.length === 0 &&
      typeof data?.answer === "string"
    ) {
      return data.answer.trim();
    }

    if (
      sections.length === 0 &&
      typeof data?.response === "string"
    ) {
      return data.response.trim();
    }

    if (
      sections.length === 0 &&
      typeof data?.message === "string"
    ) {
      return data.message.trim();
    }

    return sections.join("\n\n");
  };

  // ===================================================
  // FORMAT BACKEND ERROR
  // ===================================================

  const getBackendError = (
    data,
    status
  ) => {
    if (
      Array.isArray(
        data?.detail
      )
    ) {
      return data.detail
        .map(
          (item) =>
            item?.msg ||
            String(item)
        )
        .join(", ");
    }

    if (
      typeof data?.detail ===
      "string"
    ) {
      return data.detail;
    }

    if (
      typeof data?.message ===
      "string"
    ) {
      return data.message;
    }

    if (
      typeof data?.error ===
      "string"
    ) {
      return data.error;
    }

    return `Tutor request failed. HTTP ${status}.`;
  };

  // ===================================================
  // SEND MESSAGE
  // ===================================================

  const sendMessage = async () => {
    const userMessage =
      message.trim();

    if (
      !userMessage ||
      loading
    ) {
      return;
    }

    // =================================================
    // ADD USER MESSAGE
    // =================================================

    setMessages(
      (previousMessages) => [
        ...previousMessages,
        {
          role: "user",
          content: userMessage,
        },
      ]
    );

    setMessage("");
    setLoading(true);

    try {
      // ===============================================
      // DEBUG LOG
      // ===============================================

      console.log(
        "================================="
      );

      console.log(
        "AI TUTOR REQUEST"
      );

      console.log(
        "================================="
      );

      console.log(
        "API URL:",
        API_URL
      );

      console.log(
        "Topic:",
        topic
      );

      console.log(
        "Level:",
        level
      );

      console.log(
        "Question:",
        userMessage
      );

      // ===============================================
      // API REQUEST
      // ===============================================

      const response =
        await fetch(
          API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              topic:
                topic.trim() ||
                "General Learning",

              level,

              question:
                userMessage,
            }),
          }
        );

      // ===============================================
      // RESPONSE TEXT
      // ===============================================

      console.log(
        "HTTP STATUS:",
        response.status
      );

      const rawText =
        await response.text();

      console.log(
        "RAW BACKEND RESPONSE:",
        rawText
      );

      // ===============================================
      // PARSE JSON
      // ===============================================

      let data = null;

      if (rawText.trim()) {
        try {
          data =
            JSON.parse(
              rawText
            );
        } catch {
          throw new Error(
            `Backend returned invalid JSON:\n${rawText}`
          );
        }
      }

      console.log(
        "PARSED BACKEND DATA:",
        data
      );

      // ===============================================
      // HTTP ERROR
      // ===============================================

      if (!response.ok) {
        throw new Error(
          getBackendError(
            data,
            response.status
          )
        );
      }

      // ===============================================
      // EMPTY RESPONSE
      // ===============================================

      if (!data) {
        throw new Error(
          "Backend returned an empty response."
        );
      }

      // ===============================================
      // FORMAT AI RESPONSE
      // ===============================================

      const answer =
        formatTutorResponse(
          data
        );

      console.log(
        "FORMATTED AI ANSWER:",
        answer
      );

      // ===============================================
      // EMPTY AI RESPONSE
      // ===============================================

      if (
        !answer ||
        !answer.trim()
      ) {
        console.error(
          "Backend returned data but no supported TutorResponse fields were found."
        );

        console.error(
          "Backend data:",
          data
        );

        throw new Error(
          "AI Tutor returned an empty response. Check the backend TutorResponse schema."
        );
      }

      // ===============================================
      // ADD ASSISTANT RESPONSE
      // ===============================================

      setMessages(
        (previousMessages) => [
          ...previousMessages,
          {
            role: "assistant",
            content: answer,
          },
        ]
      );

    } catch (error) {
      // ===============================================
      // ERROR LOG
      // ===============================================

      console.error(
        "================================="
      );

      console.error(
        "AI TUTOR ERROR"
      );

      console.error(
        "================================="
      );

      console.error(
        error
      );

      // ===============================================
      // SHOW ERROR IN CHAT
      // ===============================================

      setMessages(
        (previousMessages) => [
          ...previousMessages,
          {
            role: "assistant",
            error: true,
            content:
              error?.message ||
              "Unable to connect to AI Tutor.",
          },
        ]
      );

    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // ENTER KEY
  // ===================================================

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <main className="tutor-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section className="tutor-header">

        <p className="welcome-label">
          AI LEARNING PLATFORM
        </p>

        <h1>
          AI Tutor 🤖
        </h1>

        <p className="welcome-text">
          Ask questions and get
          personalized explanations
          from your AI Tutor.
        </p>

      </section>

      {/* =================================================
          TUTOR CONTAINER
      ================================================= */}

      <section className="tutor-container">

        {/* =================================================
            TOP HEADER
        ================================================= */}

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
                Your personal learning
                assistant
              </p>

            </div>

          </div>

          {/* ACTIONS */}

          <div className="tutor-actions">

            <div className="ai-status">

              <span className="status-dot" />

              {loading
                ? "Thinking..."
                : "Online"}

            </div>

            <button
              type="button"
              className="clear-button"
              onClick={
                clearChat
              }
              disabled={loading}
            >
              <Trash2 size={15} />
              Clear
            </button>

          </div>

        </div>

        {/* =================================================
            TOPIC + LEVEL
        ================================================= */}

        <div className="tutor-settings">

          {/* TOPIC */}

          <div className="tutor-field">

            <label htmlFor="tutor-topic">

              <BookOpen
                size={16}
              />

              Topic

            </label>

            <input
              id="tutor-topic"
              type="text"
              value={topic}
              onChange={(event) =>
                setTopic(
                  event.target.value
                )
              }
              placeholder="Enter learning topic"
              disabled={loading}
            />

          </div>

          {/* LEVEL */}

          <div className="tutor-field">

            <label htmlFor="tutor-level">

              <Sparkles
                size={16}
              />

              Level

            </label>

            <select
              id="tutor-level"
              value={level}
              onChange={(event) =>
                setLevel(
                  event.target.value
                )
              }
              disabled={loading}
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

        {/* =================================================
            CHAT
        ================================================= */}

        <div className="chat-container">

          {messages.map(
            (
              msg,
              index
            ) => (

              <div
                key={`${msg.role}-${index}`}
                className={`chat-message ${
                  msg.role === "user"
                    ? "user"
                    : "assistant"
                }`}
              >

                {/* MESSAGE AVATAR */}

                <div className="message-avatar">

                  {msg.role ===
                  "user" ? (
                    <User
                      size={17}
                    />
                  ) : (
                    <Bot
                      size={17}
                    />
                  )}

                </div>

                {/* MESSAGE CONTENT */}

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
            )
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (

            <div className="chat-message assistant">

              <div className="message-avatar">

                <Bot
                  size={17}
                />

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

          {/* SCROLL TARGET */}

          <div
            ref={chatEndRef}
          />

        </div>

        {/* =================================================
            CHAT INPUT
        ================================================= */}

        <div className="chat-input-container">

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            placeholder="Ask your AI Tutor anything..."
            rows={1}
            disabled={loading}
          />

          <button
            type="button"
            className="send-button"
            onClick={
              sendMessage
            }
            disabled={
              loading ||
              !message.trim()
            }
            aria-label="Send message"
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

        {/* =================================================
            HINT
        ================================================= */}

        <p className="chat-hint">
          Press Enter to send •
          Shift + Enter for new line
        </p>

      </section>

    </main>
  );
}

export default AITutor;