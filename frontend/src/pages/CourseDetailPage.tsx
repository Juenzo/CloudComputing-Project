import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./css/CourseDetailPage.css";

interface Chapter {
  id: number | string;
  courseId?: number | string;
  title: string;
  content?: string;
  order?: number;
}

interface CourseDetail {
  id: number;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  pdfUrl?: string;
  chapters?: Chapter[];
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

  if (loading) {
    return (
      <section className="course-detail-wrapper">
        <p className="course-detail-info">Chargement du cours...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="course-detail-wrapper">
        <p className="course-form-error">
          Impossible de charger le cours : {error}
        </p>
      </section>
    );
  }

  if (!course) {
    return (
      <section className="course-detail-wrapper">
        <p className="course-detail-info">Cours introuvable.</p>
      </section>
    );
  }

  const chapters = course.chapters ?? [];

  return (
    <section className="course-detail-wrapper">
      <div className="course-detail-topbar">
        <Link to="/" className="course-detail-back">
          ← Retour au catalogue
        </Link>
      </div>

      <div className="course-detail-card">
        {/* HEADER */}
        <header className="course-detail-header">
          <div className="course-detail-title-block">
            <div className="course-detail-title-row">
              <h1>{course.title}</h1>
              <Link
                to={`/courses/${course.id}/lessons/new`}
                className="course-btn-outline course-detail-add-lesson"
              >
                + Ajouter une leçon
              </Link>
            </div>

            {course.description && (
              <p className="course-detail-subtitle">
                {course.description.length > 140
                  ? course.description.slice(0, 140) + "..."
                  : course.description}
              </p>
            )}
          </div>

          <div className="course-detail-tags">
            {course.level && (
              <span className="course-tag course-tag-level">
                {course.level}
              </span>
            )}
            {course.category && (
              <span className="course-tag course-tag-category">
                {course.category}
              </span>
            )}
          </div>
        </header>

        {/* BODY */}
        <div className="course-detail-body">
          {/* Colonne principale */}
          <div className="course-detail-main">
            {course.description && (
              <section className="course-detail-section">
                <h2>À propos de ce cours</h2>
                <p className="course-detail-description">
                  {course.description}
                </p>
              </section>
            )}

            <section className="course-detail-section">
              <h2>Chapitres</h2>

              {chapters.length === 0 && (
                <p className="course-detail-info">
                  Aucun chapitre défini (le cours est peut-être principalement
                  basé sur un PDF ou des ressources externes).
                </p>
              )}

              {chapters.length > 0 && (
                <ol className="course-chapter-list">
                  {chapters
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((chapter) => (
                      <li key={chapter.id} className="course-chapter-item">
                        <div className="course-chapter-header">
                          <span className="course-chapter-order">
                            Chapitre {chapter.order ?? "?"}
                          </span>
                          <h3>{chapter.title}</h3>
                        </div>
                        {chapter.content && (
                          <p className="course-chapter-content">
                            {chapter.content.length > 180
                              ? chapter.content.slice(0, 180) + "..."
                              : chapter.content}
                          </p>
                        )}
                      </li>
                    ))}
                </ol>
              )}
            </section>

            <section className="course-detail-section">
              <h2>Quiz du cours</h2>
              <p className="course-detail-info">
                Teste tes connaissances ou configure le quiz associé à ce cours.
              </p>
              <div className="course-detail-quiz-actions">
                <Link
                  to={`/courses/${course.id}/quiz/new`}
                  className="course-btn-outline"
                >
                  Configurer le quiz
                </Link>
                <Link
                  to={`/courses/${course.id}/quiz`}
                  className="course-btn-primary"
                >
                  Faire le quiz
                </Link>
              </div>
            </section>
          </div>

          {/* Colonne PDF / ressources */}
          {course.pdfUrl && (
            <aside className="course-detail-aside">
              <h2>Contenu PDF</h2>
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
                className="course-btn-primary course-pdf-open-btn"
              >
                Ouvrir le PDF dans un nouvel onglet
              </a>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseDetailPage;
