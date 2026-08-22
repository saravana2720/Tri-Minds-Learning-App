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

function LearningPlan() {
  const [topic, setTopic] = useState("Machine Learning Engineer");
  const [level, setLevel] = useState("beginner");
  const [duration, setDuration] = useState("4");

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // COMPLETED WEEKS
  // ==========================================

  const [completedWeeks, setCompletedWeeks] = useState(() => {
    try {
      const savedWeeks = localStorage.getItem(
        "completedLearningWeeks"
      );

      return savedWeeks ? JSON.parse(savedWeeks) : [];
    } catch {
      return [];
    }
  });

  // ==========================================
  // SAVE COMPLETED WEEKS TO LOCAL STORAGE
  // ==========================================

  useEffect(() => {
    localStorage.setItem(
      "completedLearningWeeks",
      JSON.stringify(completedWeeks)
    );
  }, [completedWeeks]);

  // ==========================================
  // GENERATE LEARNING PLAN
  // ==========================================

  const generatePlan = async () => {
    setError("");

    if (!topic.trim()) {
      setError("Please enter a learning topic.");
      return;
    }

    const weeks = Number(duration);

    if (weeks < 1 || weeks > 12) {
      setError(
        "Duration must be between 1 and 12 weeks."
      );
      return;
    }

    setLoading(true);
    setPlan(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/learning-plan",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            topic: topic.trim(),
            level: level,
            duration_weeks: weeks,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail
            ? typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail)
            : `API Error: ${response.status}`
        );
      }

      // Reset progress for new plan
      setCompletedWeeks([]);

      // Save generated plan
      setPlan(data);

    } catch (err) {
      console.error(
        "Learning Plan Error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while generating the learning plan."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // TOGGLE WEEK COMPLETION
  // ==========================================

  const toggleWeek = (weekNumber) => {
    setCompletedWeeks((previousWeeks) => {
      if (previousWeeks.includes(weekNumber)) {
        return previousWeeks.filter(
          (week) => week !== weekNumber
        );
      }

      return [
        ...previousWeeks,
        weekNumber,
      ];
    });
  };

  // ==========================================
  // PROGRESS CALCULATION
  // ==========================================

  const totalWeeks = plan?.weeks?.length || 0;

  const completedCount = completedWeeks.filter(
    (weekNumber) =>
      plan?.weeks?.some(
        (week) => week.week === weekNumber
      )
  ).length;

  const progressPercentage =
    totalWeeks > 0
      ? Math.round(
          (completedCount / totalWeeks) * 100
        )
      : 0;

  return (
    <main className="learning-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <section className="learning-header">

        <p className="welcome-label">
          AI LEARNING PLATFORM
        </p>

        <h1>
          Learning Plan 📚
        </h1>

        <p className="welcome-text">
          Generate your personalized AI learning roadmap.
        </p>

      </section>

      {/* ======================================
          FORM CARD
      ====================================== */}

      <section className="learning-plan-card">

        <div className="learning-plan-header">

          <span className="card-label">
            <Sparkles size={14} />
            &nbsp; AI LEARNING PLAN
          </span>

          <h2>
            Generate Your Learning Plan
          </h2>

          <p>
            Enter your role, experience level,
            and preferred learning duration.
          </p>

        </div>

        <div className="learning-plan-form-content">

          {/* TOPIC */}

          <div className="learning-field">

            <label htmlFor="learning-topic">
              <BookOpen size={15} />
              Learning Topic / Role
            </label>

            <input
              id="learning-topic"
              type="text"
              value={topic}
              onChange={(e) =>
                setTopic(e.target.value)
              }
              placeholder="Example: Machine Learning Engineer"
            />

          </div>

          {/* LEVEL */}

          <div className="learning-field">

            <label htmlFor="learning-level">
              <Target size={15} />
              Experience Level
            </label>

            <select
              id="learning-level"
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

          {/* DURATION */}

          <div className="learning-field">

            <label htmlFor="learning-duration">
              <Clock size={15} />
              Duration
            </label>

            <select
              id="learning-duration"
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value)
              }
            >

              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                (week) => (
                  <option
                    key={week}
                    value={week}
                  >
                    {week} {week === 1 ? "Week" : "Weeks"}
                  </option>
                )
              )}

            </select>

          </div>

          {/* GENERATE BUTTON */}

          <div className="generate-button-wrapper">

            <button
              type="button"
              className="generate-button"
              onClick={generatePlan}
              disabled={loading}
            >

              {loading ? (
                "Generating..."
              ) : (
                <>
                  Generate Learning Plan
                  <ArrowRight size={18} />
                </>
              )}

            </button>

          </div>

        </div>

      </section>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ======================================
          GENERATED PLAN
      ====================================== */}

      {plan && (
        <section className="learning-plan-result">

          {/* RESULT HEADER */}

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
                {plan.duration_weeks} weeks
              </strong>

            </p>

          </div>

          {/* ==================================
              PROGRESS SECTION
          ================================== */}

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
                {completedCount} of {totalWeeks} weeks completed
              </span>

              <span>
                {totalWeeks - completedCount} remaining
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

          {/* ==================================
              WEEKS
          ================================== */}

          <div className="weeks-container">

            {plan.weeks?.map((week) => {

              const isCompleted =
                completedWeeks.includes(week.week);

              return (

                <article
                  key={week.week}
                  className={`week-card ${
                    isCompleted
                      ? "week-completed"
                      : ""
                  }`}
                >

                  <span className="week-number">
                    WEEK {week.week}
                  </span>

                  <h3>
                    {week.title}
                  </h3>

                  <div className="week-content">

                    <h4>
                      Topics
                    </h4>

                    <ul>

                      {week.topics?.map(
                        (topicItem, index) => (
                          <li key={index}>
                            {topicItem}
                          </li>
                        )
                      )}

                    </ul>

                    {/* PRACTICE */}

                    <div className="practice-box">

                      <span>
                        PRACTICE TASK
                      </span>

                      <p>
                        {week.practice_task}
                      </p>

                    </div>

                    {/* COMPLETE BUTTON */}

                    <button
                      type="button"
                      className={`complete-week-button ${
                        isCompleted
                          ? "completed"
                          : ""
                      }`}
                      onClick={() =>
                        toggleWeek(week.week)
                      }
                    >

                      {isCompleted ? (
                        <>
                          <CheckCircle2 size={18} />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle size={18} />
                          Mark as Complete
                        </>
                      )}

                    </button>

                  </div>

                </article>
              );
            })}

          </div>

          {/* ==================================
              FINAL PROJECT
          ================================== */}

          {plan.final_project && (
            <div className="final-project-card">

              <span className="final-project-label">
                FINAL PROJECT
              </span>

              <h3>
                {plan.final_project}
              </h3>

              <p>
                Apply everything you learned in
                this personalized final project.
              </p>

            </div>
          )}

        </section>
      )}

    </main>
  );
}

export default LearningPlan;