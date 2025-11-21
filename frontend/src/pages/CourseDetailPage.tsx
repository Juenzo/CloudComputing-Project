import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

interface Chapter {
  id: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
}

interface CourseDetail {
  id: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  pdfUrl?: string;       // 👈 ajouté
  chapters: Chapter[];
}

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!courseId) return;

    setLoading(true);
    setError("");

    fetch(`/api/courses/${courseId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur HTTP " + res.status);
        }
        return res.json();
      })
      .then((data: CourseDetail) => {
        setCourse(data);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <p>Chargement du cours...</p>;
  if (error) return <p className="error">Erreur : {error}</p>;
  if (!course) return <p>Cours introuvable.</p>;

  return (
    <div className="course-detail">
      <header className="course-detail-header">
        <h2>{course.title}</h2>

        <div className="course-detail-meta">
          {course.level && (
            <span>
              <strong>Niveau :</strong> {course.level}
            </span>
          )}
          {course.category && (
            <span>
              <strong>Catégorie :</strong> {course.category}
            </span>
          )}
        </div>

        {course.description && (
          <p className="course-detail-description">{course.description}</p>
        )}

      {course.pdfUrl && (
        <section className="course-pdf-section">
          <h3>Contenu du cours (PDF)</h3>

          <div className="course-pdf-frame-wrapper">
            <iframe
              src={course.pdfUrl}
              title={`PDF du cours ${course.title}`}
              className="course-pdf-frame"
            />
          </div>

          <a
            href={course.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="course-btn-primary"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Ouvrir le PDF dans un nouvel onglet
          </a>
        </section>
      )}

      </header>

      <section style={{ marginTop: "2rem" }}>
        <h3>Chapitres</h3>
        {(!course.chapters || course.chapters.length === 0) && (
          <p>Aucun chapitre défini (le cours est principalement basé sur le PDF).</p>
        )}
        {course.chapters && course.chapters.length > 0 && (
          <ol>
            {course.chapters
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((chapter) => (
                <li key={chapter.id}>
                  <h4>{chapter.title}</h4>
                  <p>{chapter.content}</p>
                </li>
              ))}
          </ol>
        )}
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>Quiz du cours</h3>
        <p>
          <Link to={`/courses/${course.id}/quiz/new`}>
            Créer / éditer le quiz du cours
          </Link>
        </p>
        <p>
          <Link to={`/courses/${course.id}/quiz`}>Faire le quiz</Link>
        </p>
      </section>
    </div>
  );
};

export default CourseDetailPage;
