import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Settings,
} from "lucide-react";

import logo from "../assets/tri_mind.jpeg";

// ==========================================
// SIDEBAR MENU ITEMS
// ==========================================

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "AI Tutor",
    icon: GraduationCap,
  },
  {
    name: "Learning Plan",
    icon: BookOpen,
  },
  {
    name: "Quiz",
    icon: ClipboardCheck,
  },
  {
    name: "Progress",
    icon: BarChart3,
  },
  {
    name: "Settings",
    icon: Settings,
  },
];

// ==========================================
// SIDEBAR COMPONENT
// ==========================================

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">

      {/* ======================================
          BRAND
      ====================================== */}

      <div className="brand">
        {/* Logo */}
        <div
          className="brand-logo"
          aria-label="Tri-Minds AI Logo"
        >
          <img
            src={logo}
            alt="Tri-Minds AI Logo"
          />
        </div>

        {/* Brand Name */}
        <div className="brand-text">
          <h2>Tri-Minds AI</h2>
          <span>AI Learning Platform</span>
        </div>
      </div>

      {/* ======================================
          NAVIGATION
      ====================================== */}

      <nav
        className="sidebar-nav"
        aria-label="Main navigation"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;

          return (
            <button
              key={item.name}
              type="button"
              className={`nav-item ${
                isActive ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
              aria-current={
                isActive ? "page" : undefined
              }
            >
              {/* Icon */}
              <span className="nav-icon">
                <Icon
                  size={20}
                  strokeWidth={2}
                />
              </span>

              {/* Text */}
              <span className="nav-text">
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ======================================
          SIDEBAR FOOTER
      ====================================== */}

      <div className="sidebar-footer">
        <span>Tri-Minds AI</span>
        <small>v1.0</small>
      </div>

    </aside>
  );
}

export default Sidebar;