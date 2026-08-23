import { useEffect, useState } from "react";

import {
  Sparkles,
  BookOpen,
  Target,
  Clock,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";

// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://gather-restaurant-advertisements-brooks.trycloudflare.com";

function LearningPlan() {
  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [topic, setTopic] = useState(
    "Machine Learning Engineer"
  );

  const [level, setLevel] = useState(
    "beginner"
  );

  const [duration, setDuration] = useState(
    "4"
  );

  // ==========================================================
  // PLAN STATE
  // ==========================================================

  const [plan, setPlan] = useState(null);

  const [loading, setLoading] = useState(
    false
  );

  const [error, setError] = useState("");

  // ==========================================================
  // COMPLETED WEEKS
  // ==========================================================

  const [completedWeeks, setCompletedWeeks] =
    useState(() => {
      try {
        const savedWeeks =
          localStorage.getItem(
            "completedLearningWeeks"
          );

        if (!savedWeeks) {
          return [];
        }

        const parsedWeeks =
          JSON.parse(savedWeeks);

        return Array.isArray(parsedWeeks)
          ? parsedWeeks
          : [];
      } catch (storageError) {
        console.error(
          "Unable to load learning progress:",
          storageError
        );

        return [];
      }
    });

  // ==========================================================
  // SAVE COMPLETED WEEKS
  // ==========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "completedLearningWeeks",
        JSON.stringify(completedWeeks)
      );
    } catch (storageError) {
      console.error(
        "Unable to save learning progress:",
        storageError
      );
    }
  }, [completedWeeks]);

  // ==========================================================
  // GENERATE LEARNING PLAN
  // ==========================================================

  const generatePlan = async () => {
    // --------------------------------------------------------
    // RESET ERROR
    // --------------------------------------------------------

    setError("");

    // --------------------------------------------------------
    // VALIDATE TOPIC
    // --------------------------------------------------------

    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setError(
        "Please enter a learning topic."
      );

      return;
    }

    // --------------------------------------------------------
    // VALIDATE DURATION
    // --------------------------------------------------------

    const weeks = Number(duration);

    if (
      !Number.isInteger(weeks) ||
      weeks < 1 ||
      weeks > 12
    ) {
      setError(
        "Duration must be between 1 and 12 weeks."
      );

      return;
    }

    // --------------------------------------------------------
    // START LOADING
    // --------------------------------------------------------

    setLoading(true);

    // Clear previous plan while generating
    setPlan(null);

    try {
      console.log(
        "================================="
      );

      console.log(
        "LEARNING PLAN REQUEST"
      );

      console.log(
        "================================="
      );

      console.log(
        "API:",
        `${API_URL}/api/v1/learning-plan`
      );

      console.log(
        "Topic:",
        cleanTopic
      );

      console.log(
        "Level:",
        level
      );

      console.log(
        "Duration:",
        weeks
      );

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response = await fetch(
        `${API_URL}/api/v1/learning-plan`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            topic: cleanTopic,

            level: level,

            duration_weeks: weeks,
          }),
        }
      );

      console.log(
        "HTTP STATUS:",
        response.status
      );

      // ------------------------------------------------------
      // READ RESPONSE
      // ------------------------------------------------------

      const rawText =
        await response.text();

      console.log(
        "RAW BACKEND RESPONSE:",
        rawText
      );

      let data = null;

      try {
        data = rawText
          ? JSON.parse(rawText)
          : null;
      } catch {
        throw new Error(
          "Backend returned invalid JSON."
        );
      }

      console.log(
        "PARSED BACKEND DATA:",
        data
      );

      // ------------------------------------------------------
      // HANDLE API ERROR
      // ------------------------------------------------------

      if (!response.ok) {
        let backendError =
          `API Error: ${response.status}`;

        if (
          Array.isArray(
            data?.detail
          )
        ) {
          backendError =
            data.detail
              .map(
                (item) =>
                  item?.msg ||
                  String(item)
              )
              .join(", ");
        } else if (
          typeof data?.detail ===
          "string"
        ) {
          backendError =
            data.detail;
        } else if (
          data?.message
        ) {
          backendError =
            data.message;
        }

        throw new Error(
          backendError
        );
      }

      // ------------------------------------------------------
      // EMPTY RESPONSE
      // ------------------------------------------------------

      if (!data) {
        throw new Error(
          "Backend returned an empty response."
        );
      }

      // ------------------------------------------------------
      // VALIDATE WEEKS
      // ------------------------------------------------------

      if (
        !Array.isArray(
          data.weeks
        ) ||
        data.weeks.length === 0
      ) {
        throw new Error(
          "Backend returned a learning plan without any weeks."
        );
      }

      // ------------------------------------------------------
      // RESET PROGRESS FOR NEW PLAN
      // ------------------------------------------------------

      setCompletedWeeks([]);

      // ------------------------------------------------------
      // SAVE PLAN
      // ------------------------------------------------------

      setPlan(data);

      console.log(
        "Learning plan generated successfully."
      );
    } catch (err) {
      console.error(
        "================================="
      );

      console.error(
        "LEARNING PLAN ERROR"
      );

      console.error(
        "================================="
      );

      console.error(err);

      setPlan(null);

      setError(
        err?.message ||
          "Something went wrong while generating the learning plan."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // TOGGLE WEEK COMPLETION
  // ==========================================================

  const toggleWeek = (
    weekNumber
  ) => {
    setCompletedWeeks(
      (previousWeeks) => {
        if (
          previousWeeks.includes(
            weekNumber
          )
        ) {
          return previousWeeks.filter(
            (week) =>
              week !== weekNumber
          );
        }

        return [
          ...previousWeeks,
          weekNumber,
        ];
      }
    );
  };

  // ==========================================================
  // PROGRESS CALCULATION
  // ==========================================================

  const totalWeeks =
    Array.isArray(plan?.weeks)
      ? plan.weeks.length
      : 0;

  const completedCount =
    completedWeeks.filter(
      (weekNumber) =>
        plan?.weeks?.some(
          (week) =>
            week.week ===
            weekNumber
        )
    ).length;

  const progressPercentage =
    totalWeeks > 0
      ? Math.round(
          (completedCount /
            totalWeeks) *
            100
        )
      : 0;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="learning-page">

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <section className="learning-header">

        <p className="welcome-label">
          AI LEARNING PLATFORM
        </p>

        <h1>
          Learning Plan 📚
        </h1>

        <p className="welcome-text">
          Generate your personalized AI
          learning roadmap.
        </p>

      </section>

      {/* ====================================================
          FORM CARD
      ==================================================== */}

      <section className="learning-plan-card">

        <div className="learning-plan-header">

          <span className="card-label">

            <Sparkles
              size={14}
            />

            &nbsp; AI LEARNING PLAN

          </span>

          <h2>
            Generate Your Learning Plan
          </h2>

          <p>
            Enter your role, experience
            level, and preferred learning
            duration.
          </p>

        </div>

        <div className="learning-plan-form-content">

          {/* ==================================================
              TOPIC
          ================================================== */}

          <div className="learning-field">

            <label htmlFor="learning-topic">

              <BookOpen
                size={15}
              />

              Learning Topic / Role

            </label>

            <input
              id="learning-topic"
              type="text"
              value={topic}
              onChange={(event) =>
                setTopic(
                  event.target.value
                )
              }
              placeholder="Example: Machine Learning Engineer"
              disabled={loading}
            />

          </div>

          {/* ==================================================
              LEVEL
          ================================================== */}

          <div className="learning-field">

            <label htmlFor="learning-level">

              <Target
                size={15}
              />

              Experience Level

            </label>

            <select
              id="learning-level"
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

          {/* ==================================================
              DURATION
          ================================================== */}

          <div className="learning-field">

            <label htmlFor="learning-duration">

              <Clock
                size={15}
              />

              Duration

            </label>

            <select
              id="learning-duration"
              value={duration}
              onChange={(event) =>
                setDuration(
                  event.target.value
                )
              }
              disabled={loading}
            >

              {[
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
              ].map(
                (week) => (
                  <option
                    key={week}
                    value={week}
                  >
                    {week}{" "}
                    {week === 1
                      ? "Week"
                      : "Weeks"}
                  </option>
                )
              )}

            </select>

          </div>

          {/* ==================================================
              GENERATE BUTTON
          ================================================== */}

          <div className="generate-button-wrapper">

            <button
              type="button"
              className="generate-button"
              onClick={
                generatePlan
              }
              disabled={loading}
            >

              {loading ? (
                "Generating..."
              ) : (
                <>
                  Generate Learning Plan

                  <ArrowRight
                    size={18}
                  />
                </>
              )}

            </button>

          </div>

        </div>

      </section>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="error-message">
          <strong>
            Learning Plan Error:
          </strong>

          <br />

          {error}
        </div>
      )}

      {/* ====================================================
          GENERATED PLAN
      ==================================================== */}

      {plan && (
        <section className="learning-plan-result">

          {/* ==================================================
              RESULT HEADER
          ================================================== */}

          <div className="result-header">

            <span className="card-label">
              GENERATED PLAN
            </span>

            <h2>
              {plan.topic}
            </h2>

            <p className="result-meta">

              Level:{" "}

              <strong>
                {plan.level}
              </strong>

              {" • "}

              Duration:{" "}

              <strong>
                {plan.duration_weeks}{" "}
                weeks
              </strong>

            </p>

          </div>

          {/* ==================================================
              PROGRESS
          ================================================== */}

          <div className="learning-progress-card">

            <div className="learning-progress-header">

              <div>

                <span>
                  LEARNING PROGRESS
                </span>

                <h3>
                  Your Progress
                </h3>

              </div>

              <strong>
                {progressPercentage}%
              </strong>

            </div>

            <div className="learning-progress-info">

              <span>
                {completedCount} of{" "}
                {totalWeeks}{" "}
                weeks completed
              </span>

              <span>
                {totalWeeks -
                  completedCount}{" "}
                remaining
              </span>

            </div>

            <div className="learning-progress-bar">

              <div
                className="learning-progress-value"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />

            </div>

          </div>

          {/* ==================================================
              WEEKS
          ================================================== */}

          <div className="weeks-container">

            {plan.weeks?.map(
              (week) => {

                const isCompleted =
                  completedWeeks.includes(
                    week.week
                  );

                return (
                  <article
                    key={
                      week.week
                    }
                    className={`week-card ${
                      isCompleted
                        ? "week-completed"
                        : ""
                    }`}
                  >

                    <span className="week-number">
                      WEEK{" "}
                      {week.week}
                    </span>

                    <h3>
                      {week.title}
                    </h3>

                    <div className="week-content">

                      <h4>
                        Topics
                      </h4>

                      <ul>

                        {Array.isArray(
                          week.topics
                        ) &&
                          week.topics.map(
                            (
                              topicItem,
                              index
                            ) => (
                              <li
                                key={
                                  index
                                }
                              >
                                {
                                  topicItem
                                }
                              </li>
                            )
                          )}

                      </ul>

                      {/* ====================================
                          PRACTICE TASK
                      ==================================== */}

                      <div className="practice-box">

                        <span>
                          PRACTICE TASK
                        </span>

                        <p>
                          {week.practice_task ||
                            "Complete the practical exercises for this week."}
                        </p>

                      </div>

                      {/* ====================================
                          COMPLETE BUTTON
                      ==================================== */}

                      <button
                        type="button"
                        className={`complete-week-button ${
                          isCompleted
                            ? "completed"
                            : ""
                        }`}
                        onClick={() =>
                          toggleWeek(
                            week.week
                          )
                        }
                      >

                        {isCompleted ? (
                          <>
                            <CheckCircle2
                              size={18}
                            />

                            Completed
                          </>
                        ) : (
                          <>
                            <Circle
                              size={18}
                            />

                            Mark as Complete
                          </>
                        )}

                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>

          {/* ==================================================
              FINAL PROJECT
          ================================================== */}

          {plan.final_project && (
            <div className="final-project-card">

              <span className="final-project-label">
                FINAL PROJECT
              </span>

              <h3>
                {plan.final_project}
              </h3>

              <p>
                Apply everything you learned
                in this personalized final
                project.
              </p>

            </div>
          )}

        </section>
      )}

    </main>
  );
}

export default LearningPlan;