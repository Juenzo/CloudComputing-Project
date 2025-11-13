// src/App.tsx
import React, { useEffect, useState } from "react";

type CourseSummary = {
  id: string;
  title: string;
  level?: string;
  description?: string;
  lessonCount: number;
};

const App: React.FC = () => {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // En prod sur Azure Static Web Apps : "/api/courses"
    // En local si ton Azure Function tourne sur 7071, tu peux mettre :
    // "http://localhost:7071/api/courses"
    fetch("/api/courses")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur HTTP " + res.status);
        }
        return res.json();
      })
      .then((data: CourseSummary[]) => {
        setCourses(data);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Mon E-learning</h1>
      </header>

      <main className="main">
        <h2>Catalogue des cours</h2>

        {loading && <p>Chargement des cours...</p>}
        {error && <p className="error">Erreur : {error}</p>}

        {!loading && !error && (
          <div className="course-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                <h3>{course.title}</h3>
                {course.level && (
                  <p className="level">Niveau : {course.level}</p>
                )}
                {course.description && <p>{course.description}</p>}
                <p>{course.lessonCount} leçon(s)</p>
              </div>
            ))}

            {courses.length === 0 && (
              <p>Aucun cours trouvé. Vérifie ton API /api/courses.</p>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} – Démo e-learning
      </footer>
    </div>
  );
};

export default App;
