import { useEffect, useState } from "react";

import {
  Settings as SettingsIcon,
  User,
  Bell,
  Moon,
  Sun,
  Monitor,
  Save,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

function Settings() {
  // =========================
  // LOAD SAVED SETTINGS
  // =========================

  const [name, setName] = useState(
    localStorage.getItem("userName") || "Saravana"
  );

  const [email, setEmail] = useState(
    localStorage.getItem("userEmail") || "saravana@example.com"
  );

  const [notifications, setNotifications] = useState(
    JSON.parse(
      localStorage.getItem("notifications") || "true"
    )
  );

  const [emailUpdates, setEmailUpdates] = useState(
    JSON.parse(
      localStorage.getItem("emailUpdates") || "false"
    )
  );

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  const [saved, setSaved] = useState(false);

  // =========================
  // APPLY THEME
  // =========================

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

    // Listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      const handleSystemThemeChange = (event) => {
        root.setAttribute(
          "data-theme",
          event.matches ? "dark" : "light"
        );
      };

      mediaQuery.addEventListener(
        "change",
        handleSystemThemeChange
      );

      return () => {
        mediaQuery.removeEventListener(
          "change",
          handleSystemThemeChange
        );
      };
    }
  }, [theme]);

  // =========================
  // SAVE SETTINGS
  // =========================

  const handleSave = () => {
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem(
      "notifications",
      JSON.stringify(notifications)
    );
    localStorage.setItem(
      "emailUpdates",
      JSON.stringify(emailUpdates)
    );
    localStorage.setItem("theme", theme);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  // =========================
  // RESET SETTINGS
  // =========================

  const handleReset = () => {
    const defaultName = "Saravana";
    const defaultEmail = "saravana@example.com";
    const defaultNotifications = true;
    const defaultEmailUpdates = false;
    const defaultTheme = "dark";

    setName(defaultName);
    setEmail(defaultEmail);
    setNotifications(defaultNotifications);
    setEmailUpdates(defaultEmailUpdates);
    setTheme(defaultTheme);
    setSaved(false);

    // Save default settings immediately
    localStorage.setItem("userName", defaultName);
    localStorage.setItem("userEmail", defaultEmail);
    localStorage.setItem(
      "notifications",
      JSON.stringify(defaultNotifications)
    );
    localStorage.setItem(
      "emailUpdates",
      JSON.stringify(defaultEmailUpdates)
    );
    localStorage.setItem("theme", defaultTheme);
  };

  return (
    <div className="settings-page">

      {/* HEADER */}

      <div className="settings-header">
        <div>
          <span className="page-label">
            PLATFORM SETTINGS
          </span>

          <h1>
            Settings
          </h1>

          <p>
            Manage your profile, notifications and application preferences.
          </p>
        </div>

        <div className="settings-header-icon">
          <SettingsIcon size={28} />
        </div>
      </div>


      {/* SUCCESS MESSAGE */}

      {saved && (
        <div className="settings-success">
          <CheckCircle2 size={18} />

          <span>
            Your settings have been saved successfully.
          </span>
        </div>
      )}


      <div className="settings-grid">

        {/* PROFILE SETTINGS */}

        <div className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon purple">
              <User size={20} />
            </div>

            <div>
              <h2>
                Profile Settings
              </h2>

              <p>
                Update your personal information.
              </p>
            </div>

          </div>


          <div className="settings-form">

            <div className="settings-field">

              <label>
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your name"
              />

            </div>


            <div className="settings-field">

              <label>
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
              />

            </div>

          </div>

        </div>


        {/* NOTIFICATION SETTINGS */}

        <div className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon blue">
              <Bell size={20} />
            </div>

            <div>
              <h2>
                Notifications
              </h2>

              <p>
                Choose how you want to receive updates.
              </p>
            </div>

          </div>


          <div className="settings-options">

            <div className="settings-option">

              <div>

                <strong>
                  Learning Reminders
                </strong>

                <span>
                  Get reminders to continue your learning.
                </span>

              </div>


              <button
                type="button"
                className={`toggle-switch ${
                  notifications ? "active" : ""
                }`}
                onClick={() =>
                  setNotifications(!notifications)
                }
                aria-label="Toggle learning reminders"
              >
                <span className="toggle-thumb" />
              </button>

            </div>


            <div className="settings-option">

              <div>

                <strong>
                  Email Updates
                </strong>

                <span>
                  Receive product and learning updates by email.
                </span>

              </div>


              <button
                type="button"
                className={`toggle-switch ${
                  emailUpdates ? "active" : ""
                }`}
                onClick={() =>
                  setEmailUpdates(!emailUpdates)
                }
                aria-label="Toggle email updates"
              >
                <span className="toggle-thumb" />
              </button>

            </div>

          </div>

        </div>


        {/* APPEARANCE SETTINGS */}

        <div className="settings-card settings-card-full">

          <div className="settings-card-header">

            <div className="settings-card-icon green">
              <Monitor size={20} />
            </div>

            <div>
              <h2>
                Appearance
              </h2>

              <p>
                Select your preferred application theme.
              </p>
            </div>

          </div>


          <div className="theme-options">

            {/* LIGHT */}

            <button
              type="button"
              className={`theme-option ${
                theme === "light" ? "selected" : ""
              }`}
              onClick={() => setTheme("light")}
            >
              <Sun size={22} />

              <span>
                Light
              </span>
            </button>


            {/* DARK */}

            <button
              type="button"
              className={`theme-option ${
                theme === "dark" ? "selected" : ""
              }`}
              onClick={() => setTheme("dark")}
            >
              <Moon size={22} />

              <span>
                Dark
              </span>
            </button>


            {/* SYSTEM */}

            <button
              type="button"
              className={`theme-option ${
                theme === "system" ? "selected" : ""
              }`}
              onClick={() => setTheme("system")}
            >
              <Monitor size={22} />

              <span>
                System
              </span>
            </button>

          </div>

        </div>

      </div>


      {/* ACTION BUTTONS */}

      <div className="settings-actions">

        <button
          type="button"
          className="reset-settings-button"
          onClick={handleReset}
        >
          <RotateCcw size={17} />

          Reset
        </button>


        <button
          type="button"
          className="save-settings-button"
          onClick={handleSave}
        >
          <Save size={17} />

          Save Changes
        </button>

      </div>

    </div>
  );
}

export default Settings;