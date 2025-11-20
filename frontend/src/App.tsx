// src/App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import CourseListPage from "./pages/CourseListPage";
import CourseCreatePage from "./pages/CourseCreatePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import QuizCreatePage from "./pages/QuizCreatePage";
import QuizPlayPage from "./pages/QuizPlayPage";

type Theme = "light" | "dark";

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored as Theme;

      if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
        return "light";
      }
    }
    return "dark";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <BrowserRouter>
      <div className={`app theme-${theme}`}>
        <header className="app-header">
          <div className="container header-content">
            <Link to="/" className="logo">
              <span className="logo-dot" />
              Mon E-learning
            </Link>

            <div className="header-right">
              <nav className="nav">
                <Link to="/" className="nav-link">
                  Catalogue
                </Link>
                <Link to="/courses/new" className="nav-link nav-link-primary">
                  Créer un cours
                </Link>
              </nav>

              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={
                  theme === "light"
                    ? "Passer en mode sombre"
                    : "Passer en mode clair"
                }
              >
                <span
                  className={`theme-toggle-thumb ${
                    theme === "light" ? "thumb-light" : "thumb-dark"
                  }`}
                >
                  {theme === "light" ? "☀️" : "🌙"}
                </span>
                <span className="theme-toggle-label">
                  {theme === "light" ? "Light" : "Dark"}
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={<CourseListPage />} />
              <Route path="/courses/new" element={<CourseCreatePage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              <Route
                path="/courses/:courseId/quiz/new"
                element={<QuizCreatePage />}
              />
              <Route path="/courses/:courseId/quiz" element={<QuizPlayPage />} />
            </Routes>
          </div>
        </main>

        <footer className="app-footer">
          <div className="container footer-content">
            <span>© {new Date().getFullYear()} – Démo e-learning</span>

            <a
              href="https://github.com/Juenzo/CloudComputing-Project"
              target="_blank"
              rel="noreferrer"
              className="github-link"
              aria-label="Voir le code sur GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="github-icon"
              >
                <path d="M12 .5C5.648.5.5 5.648.5 12c0 5.088 3.292 9.395 7.868 10.918.576.107.786-.25.786-.556 0-.274-.01-1.002-.015-1.967-3.2.695-3.878-1.542-3.878-1.542-.524-1.33-1.28-1.685-1.28-1.685-1.046-.715.08-.7.08-.7 1.157.082 1.766 1.189 1.766 1.189 1.028 1.762 2.698 1.253 3.354.958.104-.744.402-1.253.73-1.54-2.553-.291-5.236-1.276-5.236-5.68 0-1.255.45-2.28 1.188-3.084-.12-.292-.515-1.466.112-3.056 0 0 .967-.31 3.17 1.178a11.02 11.02 0 0 1 2.886-.388c.979.005 1.965.132 2.886.388 2.2-1.488 3.165-1.178 3.165-1.178.63 1.59.236 2.764.116 3.056.74.804 1.185 1.83 1.185 3.084 0 4.416-2.688 5.386-5.25 5.672.414.36.786 1.081.786 2.184 0 1.578-.014 2.85-.014 3.24 0 .31.204.672.794.554C20.213 21.39 23.5 17.085 23.5 12 23.5 5.648 18.352.5 12 .5Z" />
              </svg>
            </a>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
