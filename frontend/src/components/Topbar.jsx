import { useEffect, useState } from "react";
import {
  Bell,
  Moon,
  Sun,
  Search,
} from "lucide-react";

function Topbar() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  // Apply theme to application
  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;

    if (selectedTheme === "system") {
      const systemTheme = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "dark"
        : "light";

      root.setAttribute("data-theme", systemTheme);
    } else {
      root.setAttribute("data-theme", selectedTheme);
    }
  };

  // Apply theme when component loads
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Toggle between Dark and Light
  const toggleTheme = () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme");

    const newTheme =
      currentTheme === "dark"
        ? "light"
        : "dark";

    setTheme(newTheme);

    localStorage.setItem("theme", newTheme);

    applyTheme(newTheme);
  };

  return (
    <header className="topbar">

      {/* SEARCH */}

      <div className="search-box">
        <Search size={19} />

        <input
          type="text"
          placeholder="Search anything..."
        />
      </div>


      {/* RIGHT SIDE */}

      <div className="topbar-right">

        {/* NOTIFICATION */}

        <button
          type="button"
          className="icon-button"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>


        {/* THEME TOGGLE */}

        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {document.documentElement.getAttribute("data-theme") ===
          "dark" ? (
            <Sun size={20} />
          ) : (
            <Moon size={20} />
          )}
        </button>


        {/* PROFILE */}

        <div className="profile">

          <div className="avatar">
            R
          </div>

          <div className="profile-info">
            <strong>
              Ran
            </strong>

            <span>
              ML Engineer
            </span>
          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;