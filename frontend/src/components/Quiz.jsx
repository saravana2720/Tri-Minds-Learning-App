import { useState } from "react";

import {
  Sparkles,
  BookOpen,
  Target,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";

function Quiz() {
  // ============================================================
  // API
  // ============================================================

  const API_URL = "http://127.0.0.1:8000/api/v1/quiz";

  // ============================================================
  // LOCAL STORAGE
  // ============================================================

  const QUIZ_PROGRESS_KEY = "tri-minds-quiz-progress";

  // ============================================================
  // FORM STATE
  // ============================================================

  const [topic, setTopic] = useState("Machine Learning");

  const [level, setLevel] = useState("beginner");

  const [numberOfQuestions, setNumberOfQuestions] =
    useState("5");

  // ============================================================
  // QUIZ STATE
  // ============================================================

  const [quiz, setQuiz] = useState(null);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] = useState({});

  const [submitted, setSubmitted] =
    useState(false);

  // ============================================================
  // UI STATE
  // ============================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // NORMALIZE TEXT
  // ============================================================

  const normalizeText = (text) => {
    if (
      text === null ||
      text === undefined
    ) {
      return "";
    }

    return String(text)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/^[a-d][.)]\s*/i, "")
      .replace(/^[1-4][.)]\s*/, "")
      .replace(/[?.!,;:]+$/g, "")
      .trim();
  };

  // ============================================================
  // NORMALIZE CORRECT ANSWER
  // ============================================================

  const normalizeCorrectAnswer = (
    correctAnswer,
    options
  ) => {
    if (
      correctAnswer === null ||
      correctAnswer === undefined
    ) {
      return "";
    }

    if (
      !Array.isArray(options) ||
      options.length !== 4
    ) {
      return String(correctAnswer).trim();
    }

    const answer =
      String(correctAnswer).trim();

    if (!answer) {
      return "";
    }

    // ----------------------------------------------------------
    // EXACT OPTION MATCH
    // ----------------------------------------------------------

    const exactOption =
      options.find(
        (option) =>
          normalizeText(option) ===
          normalizeText(answer)
      );

    if (exactOption) {
      return exactOption;
    }

    // ----------------------------------------------------------
    // A / B / C / D
    // ----------------------------------------------------------

    if (/^[A-Da-d]$/.test(answer)) {
      const index =
        answer
          .toUpperCase()
          .charCodeAt(0) - 65;

      return options[index] || "";
    }

    // ----------------------------------------------------------
    // 1 / 2 / 3 / 4
    // ----------------------------------------------------------

    if (/^[1-4]$/.test(answer)) {
      const index =
        Number(answer) - 1;

      return options[index] || "";
    }

    // ----------------------------------------------------------
    // A. Answer
    // A) Answer
    // ----------------------------------------------------------

    const letterMatch =
      answer.match(
        /^([A-Da-d])[.)]\s*(.*)$/s
      );

    if (letterMatch) {
      const letter =
        letterMatch[1]
          .toUpperCase();

      const index =
        letter.charCodeAt(0) - 65;

      return options[index] || "";
    }

    // ----------------------------------------------------------
    // 1. Answer
    // 1) Answer
    // ----------------------------------------------------------

    const numberMatch =
      answer.match(
        /^([1-4])[.)]\s*(.*)$/s
      );

    if (numberMatch) {
      const index =
        Number(numberMatch[1]) - 1;

      return options[index] || "";
    }

    return answer;
  };

  // ============================================================
  // NORMALIZE QUESTION
  // ============================================================

  const normalizeQuestion = (
    question,
    index
  ) => {
    if (
      !question ||
      typeof question !== "object"
    ) {
      return null;
    }

    // ----------------------------------------------------------
    // QUESTION TEXT
    // ----------------------------------------------------------

    const questionText =
      question.question ||
      question.text ||
      question.question_text ||
      question.questionText ||
      "";

    const cleanQuestionText =
      String(questionText).trim();

    if (!cleanQuestionText) {
      return null;
    }

    // ----------------------------------------------------------
    // OPTIONS
    // ----------------------------------------------------------

    let options =
      Array.isArray(question.options)
        ? question.options
        : [];

    options = options
      .map((option) => {
        if (
          typeof option === "object" &&
          option !== null
        ) {
          return (
            option.text ||
            option.label ||
            option.value ||
            ""
          );
        }

        return String(option ?? "");
      })
      .map((option) =>
        String(option).trim()
      )
      .filter(Boolean);

    // ----------------------------------------------------------
    // REMOVE DUPLICATE OPTIONS
    // ----------------------------------------------------------

    const uniqueOptions = [];

    const optionSet = new Set();

    options.forEach((option) => {
      const key =
        normalizeText(option);

      if (!optionSet.has(key)) {
        optionSet.add(key);

        uniqueOptions.push(option);
      }
    });

    // ----------------------------------------------------------
    // EXACTLY FOUR OPTIONS
    // ----------------------------------------------------------

    if (
      uniqueOptions.length !== 4
    ) {
      console.warn(
        "Invalid question: expected exactly 4 options",
        {
          question:
            cleanQuestionText,
          options:
            uniqueOptions,
        }
      );

      return null;
    }

    // ----------------------------------------------------------
    // CORRECT ANSWER
    // ----------------------------------------------------------

    const rawCorrectAnswer =
      question.correct_answer ??
      question.correctAnswer ??
      question.answer ??
      question.correct ??
      "";

    const correctAnswer =
      normalizeCorrectAnswer(
        rawCorrectAnswer,
        uniqueOptions
      );

    const correctExists =
      uniqueOptions.some(
        (option) =>
          normalizeText(option) ===
          normalizeText(
            correctAnswer
          )
      );

    if (!correctExists) {
      console.warn(
        "Invalid correct answer",
        {
          question:
            cleanQuestionText,

          rawCorrectAnswer,

          correctAnswer,

          options:
            uniqueOptions,
        }
      );

      return null;
    }

    // ----------------------------------------------------------
    // EXPLANATION
    // ----------------------------------------------------------

    const explanation =
      question.explanation ||
      question.reason ||
      "No explanation provided.";

    // ----------------------------------------------------------
    // ID
    // ----------------------------------------------------------

    const generatedId =
      `question-${index}-${normalizeText(
        cleanQuestionText
      )
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .substring(0, 50)}`;

    // ----------------------------------------------------------
    // FINAL QUESTION
    // ----------------------------------------------------------

    return {
      ...question,

      id:
        question.id ??
        question.question_id ??
        generatedId,

      question:
        cleanQuestionText,

      options:
        uniqueOptions,

      correct_answer:
        correctAnswer,

      explanation:
        String(
          explanation
        ).trim(),
    };
  };

  // ============================================================
  // REMOVE DUPLICATE QUESTIONS
  // ============================================================

  const removeDuplicateQuestions = (
    questions
  ) => {
    if (
      !Array.isArray(questions)
    ) {
      return [];
    }

    const uniqueQuestions = [];

    const questionSet =
      new Set();

    questions.forEach(
      (question, index) => {
        const cleanQuestion =
          normalizeQuestion(
            question,
            index
          );

        if (!cleanQuestion) {
          return;
        }

        const key =
          normalizeText(
            cleanQuestion.question
          );

        if (
          !questionSet.has(key)
        ) {
          questionSet.add(key);

          uniqueQuestions.push(
            cleanQuestion
          );
        }
      }
    );

    return uniqueQuestions;
  };

  // ============================================================
  // EXTRACT QUESTIONS
  // ============================================================

  const extractQuestions = (
    data
  ) => {
    if (
      Array.isArray(
        data?.questions
      )
    ) {
      return data.questions;
    }

    if (
      Array.isArray(
        data?.quiz?.questions
      )
    ) {
      return data.quiz.questions;
    }

    if (
      Array.isArray(
        data?.data?.questions
      )
    ) {
      return data.data.questions;
    }

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  };

  // ============================================================
  // REQUEST QUIZ
  // ============================================================

  const requestQuiz =
    async () => {
      const cleanTopic =
        topic.trim();

      const questionCount =
        Number(
          numberOfQuestions
        );

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

            body:
              JSON.stringify({
                topic:
                  cleanTopic,

                level,

                number_of_questions:
                  questionCount,
              }),
          }
        );

      const responseText =
        await response.text();

      let data = null;

      try {
        data =
          responseText
            ? JSON.parse(
                responseText
              )
            : null;
      } catch {
        throw new Error(
          "Backend returned invalid JSON."
        );
      }

      if (!response.ok) {
        let message =
          `API Error: ${response.status}`;

        if (data?.detail) {
          message =
            typeof data.detail ===
            "string"
              ? data.detail
              : JSON.stringify(
                  data.detail
                );
        }

        throw new Error(
          message
        );
      }

      if (!data) {
        throw new Error(
          "Backend returned an empty response."
        );
      }

      return data;
    };

  // ============================================================
  // GENERATE QUIZ
  // ============================================================

  const generateQuiz =
    async () => {
      if (loading) {
        return;
      }

      // --------------------------------------------------------
      // RESET
      // --------------------------------------------------------

      setError("");

      setQuiz(null);

      setCurrentQuestion(0);

      setAnswers({});

      setSubmitted(false);

      // --------------------------------------------------------
      // VALIDATE TOPIC
      // --------------------------------------------------------

      const cleanTopic =
        topic.trim();

      if (!cleanTopic) {
        setError(
          "Please enter a topic."
        );

        return;
      }

      // --------------------------------------------------------
      // VALIDATE COUNT
      // --------------------------------------------------------

      const questionCount =
        Number(
          numberOfQuestions
        );

      if (
        !Number.isInteger(
          questionCount
        ) ||
        questionCount < 1 ||
        questionCount > 20
      ) {
        setError(
          "Please select between 1 and 20 questions."
        );

        return;
      }

      setLoading(true);

      try {
        const data =
          await requestQuiz();

        const rawQuestions =
          extractQuestions(
            data
          );

        if (
          !rawQuestions.length
        ) {
          throw new Error(
            "Backend returned no questions."
          );
        }

        let questions =
          removeDuplicateQuestions(
            rawQuestions
          );

        if (
          questions.length <
          questionCount
        ) {
          throw new Error(
            `Backend returned ${questions.length} valid questions, but ${questionCount} were requested.`
          );
        }

        questions =
          questions.slice(
            0,
            questionCount
          );

        // ------------------------------------------------------
        // STABLE IDS
        // ------------------------------------------------------

        questions =
          questions.map(
            (
              question,
              index
            ) => ({
              ...question,

              id:
                `quiz-question-${index + 1}`,
            })
          );

        // ------------------------------------------------------
        // FINAL QUIZ
        // ------------------------------------------------------

        const finalQuiz = {
          topic:
            data?.topic ||
            data?.quiz?.topic ||
            cleanTopic,

          level:
            data?.level ||
            data?.quiz?.level ||
            level,

          questions,
        };

        setQuiz(
          finalQuiz
        );

        setCurrentQuestion(0);

        setAnswers({});

        setSubmitted(false);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (err) {
        console.error(
          "Quiz generation error:",
          err
        );

        setQuiz(null);

        setError(
          err?.message ||
            "Something went wrong while generating the quiz."
        );
      } finally {
        setLoading(false);
      }
    };

  // ============================================================
  // SELECT ANSWER
  // ============================================================

  const selectAnswer = (
    option
  ) => {
    if (
      !quiz ||
      submitted
    ) {
      return;
    }

    const question =
      quiz.questions[
        currentQuestion
      ];

    if (!question) {
      return;
    }

    setError("");

    setAnswers(
      (previous) => ({
        ...previous,

        [question.id]:
          option,
      })
    );
  };

  // ============================================================
  // GO TO QUESTION
  // ============================================================

  const goToQuestion = (
    index
  ) => {
    if (!quiz) {
      return;
    }

    if (
      index < 0 ||
      index >= quiz.questions.length
    ) {
      return;
    }

    setCurrentQuestion(
      index
    );

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // NEXT QUESTION
  // ============================================================

  const nextQuestion = () => {
    if (!quiz) {
      return;
    }

    if (
      currentQuestion <
      quiz.questions.length - 1
    ) {
      goToQuestion(
        currentQuestion + 1
      );
    }
  };

  // ============================================================
  // PREVIOUS QUESTION
  // ============================================================

  const previousQuestion = () => {
    if (
      currentQuestion > 0
    ) {
      goToQuestion(
        currentQuestion - 1
      );
    }
  };

  // ============================================================
  // CALCULATE SCORE
  // ============================================================

  const calculateScore = () => {
    if (!quiz) {
      return 0;
    }

    return quiz.questions.reduce(
      (
        total,
        question
      ) => {
        const userAnswer =
          answers[
            question.id
          ];

        const correctAnswer =
          question.correct_answer;

        if (
          normalizeText(
            userAnswer
          ) ===
          normalizeText(
            correctAnswer
          )
        ) {
          return total + 1;
        }

        return total;
      },
      0
    );
  };

  // ============================================================
  // SAVE QUIZ PROGRESS
  // ============================================================

  const saveQuizProgress = () => {
    if (!quiz) {
      return;
    }

    const finalScore =
      calculateScore();

    const finalPercentage =
      quiz.questions.length > 0
        ? Math.round(
            (finalScore /
              quiz.questions
                .length) *
              100
          )
        : 0;

    const newResult = {
      id:
        `${Date.now()}-${Math.random()}`,

      topic:
        quiz.topic,

      level:
        quiz.level,

      score:
        finalScore,

      totalQuestions:
        quiz.questions.length,

      percentage:
        finalPercentage,

      completedAt:
        new Date().toISOString(),
    };

    try {
      const existingData =
        localStorage.getItem(
          QUIZ_PROGRESS_KEY
        );

      const previousResults =
        existingData
          ? JSON.parse(
              existingData
            )
          : [];

      const results =
        Array.isArray(
          previousResults
        )
          ? previousResults
          : [];

      results.unshift(
        newResult
      );

      // Keep latest 50 quiz results
      const limitedResults =
        results.slice(
          0,
          50
        );

      localStorage.setItem(
        QUIZ_PROGRESS_KEY,
        JSON.stringify(
          limitedResults
        )
      );
    } catch (storageError) {
      console.error(
        "Unable to save quiz progress:",
        storageError
      );
    }
  };

  // ============================================================
  // SUBMIT QUIZ
  // ============================================================

  const submitQuiz = () => {
    if (!quiz) {
      return;
    }

    // --------------------------------------------------------
    // CHECK UNANSWERED QUESTIONS
    // --------------------------------------------------------

    const unansweredIndexes =
      quiz.questions
        .map(
          (
            question,
            index
          ) =>
            !answers[
              question.id
            ]
              ? index
              : null
        )
        .filter(
          (index) =>
            index !== null
        );

    if (
      unansweredIndexes.length > 0
    ) {
      setError(
        `Please answer all questions. ${unansweredIndexes.length} question(s) remaining.`
      );

      goToQuestion(
        unansweredIndexes[0]
      );

      return;
    }

    // --------------------------------------------------------
    // SAVE RESULT
    // --------------------------------------------------------

    saveQuizProgress();

    setError("");

    setSubmitted(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // RESTART QUIZ
  // ============================================================

  const restartQuiz = () => {
    setQuiz(null);

    setCurrentQuestion(0);

    setAnswers({});

    setSubmitted(false);

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // SCORE
  // ============================================================

  const score =
    calculateScore();

  const percentage =
    quiz &&
    quiz.questions.length > 0
      ? Math.round(
          (score /
            quiz.questions
              .length) *
            100
        )
      : 0;

  // ============================================================
  // RESULT SCREEN
  // ============================================================

  if (
    submitted &&
    quiz
  ) {
    return (
      <main className="quiz-page">
        <section className="learning-header">
          <p className="welcome-label">
            AI ASSESSMENT
          </p>

          <h1>
            Quiz Result 🎯
          </h1>

          <p className="welcome-text">
            Here is your quiz performance.
          </p>
        </section>

        <section className="quiz-result-card">
          <span className="card-label">
            QUIZ COMPLETED
          </span>

          <h2>
            {quiz.topic}
          </h2>

          <div className="quiz-score">
            {percentage}%
          </div>

          <p className="quiz-score-text">
            You scored{" "}
            <strong>
              {score}
            </strong>{" "}
            out of{" "}
            <strong>
              {
                quiz.questions
                  .length
              }
            </strong>
          </p>

          <div className="quiz-result-actions">
            <button
              type="button"
              className="generate-button"
              onClick={
                restartQuiz
              }
            >
              <RotateCcw
                size={18}
              />

              Take Another Quiz
            </button>
          </div>
        </section>

        <section className="quiz-review">
          <h2>
            Answer Review
          </h2>

          {quiz.questions.map(
            (
              question,
              index
            ) => {
              const userAnswer =
                answers[
                  question.id
                ];

              const correct =
                normalizeText(
                  userAnswer
                ) ===
                normalizeText(
                  question.correct_answer
                );

              return (
                <article
                  key={
                    question.id
                  }
                  className="quiz-review-card"
                >
                  <div className="quiz-review-header">
                    <span>
                      QUESTION{" "}
                      {index + 1}
                    </span>

                    {correct ? (
                      <CheckCircle2
                        size={20}
                      />
                    ) : (
                      <XCircle
                        size={20}
                      />
                    )}
                  </div>

                  <h3>
                    {
                      question.question
                    }
                  </h3>

                  <p>
                    <strong>
                      Your answer:
                    </strong>{" "}
                    {userAnswer ||
                      "Not answered"}
                  </p>

                  <p>
                    <strong>
                      Correct answer:
                    </strong>{" "}
                    {
                      question.correct_answer
                    }
                  </p>

                  <div className="quiz-explanation">
                    <strong>
                      Explanation
                    </strong>

                    <p>
                      {
                        question.explanation
                      }
                    </p>
                  </div>
                </article>
              );
            }
          )}
        </section>
      </main>
    );
  }

  // ============================================================
  // QUESTION SCREEN
  // ============================================================

  if (quiz) {
    const question =
      quiz.questions[
        currentQuestion
      ];

    if (!question) {
      return null;
    }

    const selectedAnswer =
      answers[
        question.id
      ];

    const isLastQuestion =
      currentQuestion ===
      quiz.questions.length - 1;

    // ----------------------------------------------------------
    // ANSWERED COUNT
    // ----------------------------------------------------------

    const answeredCount =
      quiz.questions.filter(
        (questionItem) =>
          Boolean(
            answers[
              questionItem.id
            ]
          )
      ).length;

    // ----------------------------------------------------------
    // PROGRESS
    //
    // Progress is based on answered questions.
    // ----------------------------------------------------------

    const progress =
      quiz.questions.length > 0
        ? (answeredCount /
            quiz.questions
              .length) *
          100
        : 0;

    return (
      <main className="quiz-page">
        <section className="learning-header">
          <p className="welcome-label">
            AI ASSESSMENT
          </p>

          <h1>
            {quiz.topic} Quiz
          </h1>

          <p className="welcome-text">
            Question{" "}
            {currentQuestion + 1}{" "}
            of{" "}
            {
              quiz.questions
                .length
            }
          </p>
        </section>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="error-message">
            <strong>
              Quiz Error:
            </strong>

            <br />

            {error}
          </div>
        )}

        <section className="quiz-question-card">

          {/* ==================================================
              QUESTION NAVIGATOR
          ================================================== */}

          <div className="question-navigator">
            {quiz.questions.map(
              (
                questionItem,
                index
              ) => {
                const isCurrent =
                  currentQuestion ===
                  index;

                const isAnswered =
                  Boolean(
                    answers[
                      questionItem.id
                    ]
                  );

                return (
                  <button
                    key={
                      questionItem.id
                    }
                    type="button"
                    className={`question-number ${
                      isCurrent
                        ? "active"
                        : ""
                    } ${
                      isAnswered
                        ? "answered"
                        : ""
                    }`}
                    onClick={() =>
                      goToQuestion(
                        index
                      )
                    }
                    title={`Question ${
                      index + 1
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              }
            )}
          </div>

          {/* ==================================================
              PROGRESS
          ================================================== */}

          <div className="quiz-question-top">
            <span>
              QUESTION{" "}
              {currentQuestion + 1}
            </span>

            <span>
              {Math.round(
                progress
              )}
              %
            </span>
          </div>

          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-value"
              style={{
                width:
                  `${progress}%`,
              }}
            />
          </div>

          <div className="quiz-progress-info">
            <span>
              {answeredCount} of{" "}
              {
                quiz.questions
                  .length
              }{" "}
              answered
            </span>

            <span>
              {Math.round(
                progress
              )}
              % complete
            </span>
          </div>

          {/* ==================================================
              QUESTION
          ================================================== */}

          <h2 className="quiz-question-title">
            {
              question.question
            }
          </h2>

          {/* ==================================================
              OPTIONS
          ================================================== */}

          <div className="quiz-options">
            {question.options.map(
              (
                option,
                index
              ) => {
                const selected =
                  selectedAnswer ===
                  option;

                const letter =
                  String.fromCharCode(
                    65 + index
                  );

                return (
                  <button
                    key={`${question.id}-${index}`}
                    type="button"
                    className={`quiz-option ${
                      selected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectAnswer(
                        option
                      )
                    }
                    aria-pressed={
                      selected
                    }
                  >
                    <span className="option-letter">
                      {letter}
                    </span>

                    <span className="option-text">
                      {option}
                    </span>

                    {selected && (
                      <CheckCircle2
                        size={20}
                        className="option-check"
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>

          {/* ==================================================
              NAVIGATION
          ================================================== */}

          <div className="quiz-navigation">
            <button
              type="button"
              className="quiz-secondary-button"
              onClick={
                previousQuestion
              }
              disabled={
                currentQuestion ===
                0
              }
            >
              <ArrowLeft
                size={18}
              />

              Previous
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                className="generate-button"
                onClick={
                  submitQuiz
                }
              >
                Submit Quiz

                <CheckCircle2
                  size={18}
                />
              </button>
            ) : (
              <button
                type="button"
                className="generate-button"
                onClick={
                  nextQuestion
                }
                disabled={
                  !selectedAnswer
                }
              >
                Next

                <ArrowRight
                  size={18}
                />
              </button>
            )}
          </div>
        </section>
      </main>
    );
  }

  // ============================================================
  // GENERATE FORM
  // ============================================================

  return (
    <main className="quiz-page">
      <section className="learning-header">
        <p className="welcome-label">
          AI ASSESSMENT
        </p>

        <h1>
          AI Quiz 🧠
        </h1>

        <p className="welcome-text">
          Test your knowledge with an
          AI-generated quiz.
        </p>
      </section>

      <section className="learning-plan-card">
        <div className="learning-plan-header">
          <span className="card-label">
            <Sparkles
              size={14}
            />

            &nbsp; AI QUIZ
          </span>

          <h2>
            Generate Your Quiz
          </h2>

          <p>
            Choose a topic,
            experience level,
            and number of questions.
          </p>
        </div>

        <div className="learning-plan-form-content">

          {/* TOPIC */}

          <div className="learning-field">
            <label htmlFor="quiz-topic">
              <BookOpen
                size={15}
              />

              Topic
            </label>

            <input
              id="quiz-topic"
              type="text"
              value={topic}
              onChange={(e) =>
                setTopic(
                  e.target.value
                )
              }
              placeholder="Example: Machine Learning"
              disabled={loading}
            />
          </div>

          {/* LEVEL */}

          <div className="learning-field">
            <label htmlFor="quiz-level">
              <Target
                size={15}
              />

              Experience Level
            </label>

            <select
              id="quiz-level"
              value={level}
              onChange={(e) =>
                setLevel(
                  e.target.value
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

          {/* QUESTION COUNT */}

          <div className="learning-field">
            <label htmlFor="quiz-count">
              <HelpCircle
                size={15}
              />

              Questions
            </label>

            <select
              id="quiz-count"
              value={
                numberOfQuestions
              }
              onChange={(e) =>
                setNumberOfQuestions(
                  e.target.value
                )
              }
              disabled={loading}
            >
              <option value="5">
                5 Questions
              </option>

              <option value="10">
                10 Questions
              </option>

              <option value="15">
                15 Questions
              </option>

              <option value="20">
                20 Questions
              </option>
            </select>
          </div>

          {/* GENERATE BUTTON */}

          <div className="generate-button-wrapper">
            <button
              type="button"
              className="generate-button"
              onClick={
                generateQuiz
              }
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="quiz-loading-spinner" />

                  Generating Quiz...
                </>
              ) : (
                <>
                  Generate Quiz

                  <ArrowRight
                    size={18}
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="error-message">
          <strong>
            Quiz Error:
          </strong>

          <br />

          {error}
        </div>
      )}
    </main>
  );
}

export default Quiz;