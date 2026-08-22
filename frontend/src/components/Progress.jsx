import {
  TrendingUp,
  Target,
  BookOpen,
  Trophy,
  CheckCircle2,
  Clock,
  Brain,
} from "lucide-react";

// ==========================================
// PROGRESS COMPONENT
// ==========================================

function Progress() {
  // ==========================================
  // OVERALL STATS
  // ==========================================

  const stats = [
    {
      title: "Learning Progress",
      value: "68%",
      icon: TrendingUp,
      description: "Overall completion",
    },
    {
      title: "Topics Completed",
      value: "12",
      icon: CheckCircle2,
      description: "Out of 20 topics",
    },
    {
      title: "Quiz Average",
      value: "82%",
      icon: Brain,
      description: "Average score",
    },
    {
      title: "Learning Streak",
      value: "7 Days",
      icon: Trophy,
      description: "Keep it going!",
    },
  ];

  // ==========================================
  // SUBJECT PROGRESS
  // ==========================================

  const subjects = [
    {
      name: "Machine Learning",
      progress: 75,
      completed: 6,
      total: 8,
    },
    {
      name: "Python",
      progress: 90,
      completed: 9,
      total: 10,
    },
    {
      name: "Deep Learning",
      progress: 45,
      completed: 3,
      total: 7,
    },
    {
      name: "Data Science",
      progress: 60,
      completed: 6,
      total: 10,
    },
  ];

  // ==========================================
  // RECENT ACTIVITY
  // ==========================================

  const recentActivity = [
    {
      title: "Completed Machine Learning Quiz",
      score: "8/10",
      time: "Today",
    },
    {
      title: "Generated Python Learning Plan",
      score: "Completed",
      time: "Yesterday",
    },
    {
      title: "AI Tutor Session",
      score: "15 mins",
      time: "2 days ago",
    },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="progress-page">

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <header className="progress-page-header">
        <div className="progress-header-content">

          <p className="progress-page-label">
            AI LEARNING PLATFORM
          </p>

          <h1 className="progress-page-title">
            <span className="progress-title-icon">
              <TrendingUp size={28} strokeWidth={2.2} />
            </span>

            <span>Your Progress</span>
          </h1>

          <p className="progress-page-description">
            Track your learning journey, progress, and
            achievements.
          </p>

        </div>

        {/* Overall Progress Badge */}

        <div className="progress-overview-badge">
          <span>Overall Progress</span>
          <strong>68%</strong>
        </div>
      </header>

      {/* ======================================
          STATS
      ====================================== */}

      <section className="progress-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className="progress-stat-card"
              key={stat.title}
            >
              <div className="progress-stat-icon">
                <Icon
                  size={22}
                  strokeWidth={2}
                />
              </div>

              <div className="progress-stat-content">
                <p>{stat.title}</p>

                <h2>{stat.value}</h2>

                <span>{stat.description}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* ======================================
          SUBJECT PROGRESS
      ====================================== */}

      <section className="progress-panel">

        <div className="progress-panel-header">

          <div className="progress-panel-icon">
            <BookOpen size={21} />
          </div>

          <div>
            <h2>Learning Progress</h2>

            <p>
              Track your progress across different topics
            </p>
          </div>

        </div>

        <div className="progress-subject-list">

          {subjects.map((subject) => (
            <article
              className="progress-subject-card"
              key={subject.name}
            >

              <div className="progress-subject-header">

                <div className="progress-subject-info">
                  <h3>{subject.name}</h3>

                  <p>
                    {subject.completed} of {subject.total}{" "}
                    lessons completed
                  </p>
                </div>

                <strong>
                  {subject.progress}%
                </strong>

              </div>

              <div
                className="progress-track"
                aria-label={`${subject.name} progress`}
              >
                <div
                  className="progress-track-fill"
                  style={{
                    width: `${subject.progress}%`,
                  }}
                />
              </div>

            </article>
          ))}

        </div>
      </section>

      {/* ======================================
          BOTTOM GRID
      ====================================== */}

      <section className="progress-bottom-grid">

        {/* ====================================
            WEEKLY GOAL
        ==================================== */}

        <article className="progress-panel progress-goal-panel">

          <div className="progress-panel-header">

            <div className="progress-panel-icon">
              <Target size={21} />
            </div>

            <div>
              <h2>Weekly Goal</h2>

              <p>
                Keep learning consistently
              </p>
            </div>

          </div>

          <div className="progress-goal-content">

            <div className="progress-goal-top">
              <div>
                <div className="progress-goal-number">
                  5 / 7
                </div>

                <p>
                  Days completed this week
                </p>
              </div>

              <div className="progress-goal-icon">
                <Target size={25} />
              </div>
            </div>

            <div
              className="progress-track"
              aria-label="Weekly goal progress"
            >
              <div
                className="progress-track-fill"
                style={{
                  width: "71%",
                }}
              />
            </div>

            <span className="progress-goal-message">
              2 more days to reach your goal 🚀
            </span>

          </div>
        </article>

        {/* ====================================
            RECENT ACTIVITY
        ==================================== */}

        <article className="progress-panel progress-activity-panel">

          <div className="progress-panel-header">

            <div className="progress-panel-icon">
              <Clock size={21} />
            </div>

            <div>
              <h2>Recent Activity</h2>

              <p>
                Your latest learning activities
              </p>
            </div>

          </div>

          <div className="progress-activity-list">

            {recentActivity.map((activity) => (
              <div
                className="progress-activity-item"
                key={`${activity.title}-${activity.time}`}
              >

                <div className="progress-activity-icon">
                  <CheckCircle2 size={17} />
                </div>

                <div className="progress-activity-info">
                  <h4>{activity.title}</h4>

                  <p>{activity.time}</p>
                </div>

                <span className="progress-activity-score">
                  {activity.score}
                </span>

              </div>
            ))}

          </div>

        </article>

      </section>

    </main>
  );
}

export default Progress;