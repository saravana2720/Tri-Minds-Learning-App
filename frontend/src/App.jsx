import { useEffect, useState } from "react";

import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  ArrowRight,
  Flame,
  Sparkles,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import LearningPlan from "./components/LearningPlan";
import AITutor from "./components/AITutor";
import Quiz from "./components/Quiz";
import Progress from "./components/Progress";
import Settings from "./components/Settings";

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // ==========================
  // THEME STATE
  // ==========================

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  // ==========================
  // APPLY THEME
  // ==========================

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches
          ? "dark"
          : "light";

        root.setAttribute("data-theme", systemTheme);
      } else {
        root.setAttribute("data-theme", theme);
      }
    };

    applyTheme();

    localStorage.setItem("theme", theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      const handleThemeChange = (event) => {
        root.setAttribute(
          "data-theme",
          event.matches ? "dark" : "light"
        );
      };

      mediaQuery.addEventListener(
        "change",
        handleThemeChange
      );

      return () => {
        mediaQuery.removeEventListener(
          "change",
          handleThemeChange
        );
      };
    }
  }, [theme]);

  // ==========================
  // NAVIGATION
  // ==========================

  const handleNavigation = (page) => {
    setActivePage(page);
  };

  // ==========================
  // DASHBOARD
  // ==========================

  const renderDashboard = () => {
    return (
      <main className="dashboard">

        {/* ================= WELCOME ================= */}

        <section className="welcome-section">

          <div>
            <p className="welcome-label">
              AI LEARNING PLATFORM
            </p>

            <h1>
              Welcome back, Ran 👋
            </h1>

            <p className="welcome-text">
              Continue your AI learning journey and build your skills.
            </p>
          </div>


          <div className="streak">

            <Flame size={22} />

            <div>
              <strong>
                7 Day Streak
              </strong>

              <span>
                Keep learning!
              </span>
            </div>

          </div>

        </section>


        {/* ================= STATS ================= */}

        <section className="stats-grid">

          {/* LEARNING PROGRESS */}

          <div className="stat-card">

            <div className="stat-icon purple">
              <BookOpen size={22} />
            </div>

            <div>
              <span>
                Learning Progress
              </span>

              <strong>
                70%
              </strong>
            </div>

          </div>


          {/* QUIZ SCORE */}

          <div className="stat-card">

            <div className="stat-icon blue">
              <ClipboardCheck size={22} />
            </div>

            <div>
              <span>
                Quiz Score
              </span>

              <strong>
                78%
              </strong>
            </div>

          </div>


          {/* COMPLETED TOPICS */}

          <div className="stat-card">

            <div className="stat-icon green">
              <BarChart3 size={22} />
            </div>

            <div>
              <span>
                Completed Topics
              </span>

              <strong>
                12
              </strong>
            </div>

          </div>

        </section>


        {/* ================= LEARNING PLAN BANNER ================= */}

        <section className="generate-plan-banner">

          <div className="generate-plan-content">

            <div className="generate-plan-icon">
              <Sparkles size={25} />
            </div>

            <div>

              <span className="generate-plan-label">
                AI LEARNING PLAN
              </span>

              <h2>
                Create your personalized learning roadmap
              </h2>

              <p>
                Let AI generate a customized learning plan
                based on your role, level, and goals.
              </p>

            </div>

          </div>


          <button
            type="button"
            className="generate-plan-button"
            onClick={() =>
              handleNavigation("Learning Plan")
            }
          >
            Generate Learning Plan

            <ArrowRight size={18} />
          </button>

        </section>


        {/* ================= CONTINUE LEARNING ================= */}

        <h2 className="section-title">
          Continue Learning
        </h2>


        <section className="feature-grid">

          {/* ================= AI TUTOR ================= */}

          <div className="feature-card tutor-card">

            <div className="feature-icon">
              <GraduationCap size={28} />
            </div>

            <span className="card-label">
              AI TUTOR
            </span>

            <h3>
              Learn with your personal AI Tutor
            </h3>

            <p>
              Ask questions, understand difficult concepts,
              and get instant explanations.
            </p>

            <button
              type="button"
              className="card-button"
              onClick={() =>
                handleNavigation("AI Tutor")
              }
            >
              Start Learning

              <ArrowRight size={18} />
            </button>

          </div>


          {/* ================= LEARNING PLAN ================= */}

          <div className="feature-card learning-card">

            <div className="feature-icon">
              <BookOpen size={28} />
            </div>

            <span className="card-label">
              LEARNING PLAN
            </span>

            <h3>
              Your personalized roadmap
            </h3>

            <p>
              Follow your AI-generated learning plan
              and complete your weekly goals.
            </p>


            <div className="progress-container">

              <div className="progress-info">

                <span>
                  Week 2 of 4
                </span>

                <strong>
                  70%
                </strong>

              </div>


              <div className="progress-bar">

                <div
                  className="progress-value"
                  style={{
                    width: "70%",
                  }}
                />

              </div>

            </div>


            <button
              type="button"
              className="card-button"
              onClick={() =>
                handleNavigation("Learning Plan")
              }
            >
              View Plan

              <ArrowRight size={18} />
            </button>

          </div>


          {/* ================= QUIZ ================= */}

          <div className="feature-card quiz-card">

            <div className="feature-icon">
              <ClipboardCheck size={28} />
            </div>

            <span className="card-label">
              QUIZ
            </span>

            <h3>
              Test your knowledge
            </h3>

            <p>
              Challenge yourself with AI-generated
              quizzes based on your learning.
            </p>

            <button
              type="button"
              className="card-button"
              onClick={() =>
                handleNavigation("Quiz")
              }
            >
              Take Quiz

              <ArrowRight size={18} />
            </button>

          </div>

        </section>


        {/* ================= ACTIVITY ================= */}

        <section className="activity-section">

          <h2 className="section-title">
            Recent Activity
          </h2>

          <p className="activity-text">
            Your learning activity will appear here.
          </p>

          <div className="activity-placeholder">
            🚀 More learning features coming soon
          </div>

        </section>

      </main>
    );
  };


  // ==========================
  // PAGE ROUTER
  // ==========================

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return renderDashboard();

      case "Learning Plan":
        return <LearningPlan />;

      case "AI Tutor":
        return <AITutor />;

      case "Quiz":
        return <Quiz />;

      case "Progress":
        return <Progress />;

      case "Settings":
        return (
          <Settings
            theme={theme}
            setTheme={setTheme}
          />
        );

      default:
        return renderDashboard();
    }
  };


  // ==========================
  // MAIN APP
  // ==========================

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}

      <Sidebar
        activePage={activePage}
        setActivePage={handleNavigation}
      />


      {/* ================= MAIN AREA ================= */}

      <div className="main-area">

        <Topbar
          theme={theme}
          setTheme={setTheme}
        />

        {renderPage()}

      </div>

    </div>
  );
}

export default App;