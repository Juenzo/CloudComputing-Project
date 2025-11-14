// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import CourseListPage from "./pages/CourseListPage";
import CourseCreatePage from "./pages/CourseCreatePage";
import CourseDetailPage from"./pages/CourseDetailPage";
import QuizCreatePage from "./pages/QuizCreatePage";
import QuizPlayPage from "./pages/QuizPlayPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <h1 className="logo">Mon E-learning</h1>

          {/* petite nav simple, tu pourras la styliser */}
          <nav>
            <Link to="/">Catalogue</Link>{" | "}
            <Link to="/courses/new">Créer un cours</Link>
          </nav>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<CourseListPage />} />
            <Route path="/courses/new" element={<CourseCreatePage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route
              path="/courses/:courseId/quiz/new"
              element={<QuizCreatePage />}
            />
            <Route
              path="/courses/:courseId/quiz"
              element={<QuizPlayPage />}
            />
          </Routes>
        </main>

        <footer className="footer">
          © {new Date().getFullYear()} – Démo e-learning
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
