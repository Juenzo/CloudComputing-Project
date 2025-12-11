import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./css/CourseDetailPage.css";

type ContentType = "video" | "pdf" | "word" | "text" | "link";

interface CourseDetail {
  id: number;
  title: string;
  description?: string;
  category?: string;
  level?: string;
}

interface LessonSummary {
  id: number;
  title: string;
  description?: string | null;
  content_type: ContentType;
  order?: number | null;
  course_id: number;
}

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!courseId) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [courseRes, lessonsRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/courses/${courseId}/lessons`),
        ]);

        if (!courseRes.ok) {
          throw new Error("Erreur HTTP cours " + courseRes.status);
        }
        if (!lessonsRes.ok) {
          throw new Error("Erreur HTTP leçons " + lessonsRes.status);
        }

        const courseData: CourseDetail = await courseRes.json();
        const lessonsData: LessonSummary[] = await lessonsRes.json();

        setCourse(courseData);
        setLessons(lessonsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  // États de chargement / erreur / cours introuvable
  if (loading) {
    return (
      <section className="course-page-wrapper">
        <div className="course-page-card">
          <p className="course-page-info">Chargement du cours...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="course-page-wrapper">
        <div className="course-page-card">
          <p className="course-form-error">
            Impossible de charger le cours : {error}
          </p>
        </div>
      </section>
    );
  }

  if (!course) {
    return (
      <section className="course-page-wrapper">
        <div className="course-page-card">
          <p className="course-page-info">Cours introuvable.</p>
        </div>
      </section>
    );
  }

  const sortedLessons = lessons
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <section className="course-page-wrapper">
      <div className="course-page-topbar">
        <Link to="/" className="course-page-back">
          ← Retour au catalogue
        </Link>
      </div>

      <div className="course-page-card">
        {/* HEADER */}
        <header className="course-page-header">
          <div className="course-page-title-block">
            <div className="course-page-title-row">
              <h1 className="course-page-title">{course.title}</h1>
              <Link
                to={`/courses/${course.id}/lessons/new`}
                className="course-page-btn-outline course-page-add-lesson"
              >
                + Ajouter une leçon
              </Link>
            </div>

            {course.description && (
              <p className="course-page-subtitle">
                {course.description.length > 140
                  ? course.description.slice(0, 140) + "…"
                  : course.description}
              </p>
            )}
          </div>

          <div className="course-page-tags">
            {course.level && (
              <span className="course-page-tag course-page-tag-level">
                {course.level}
              </span>
            )}
            {course.category && (
              <span className="course-page-tag course-page-tag-category">
                {course.category}
              </span>
            )}
          </div>
        </header>

        {/* BODY */}
        <div className="course-page-body">
          <div className="course-page-main">
            {course.description && (
              <section className="course-page-section">
                <h2 className="course-page-section-title">À propos de ce cours</h2>
                <p className="course-page-description">
                  {course.description}
                </p>
              </section>
            )}

            <section className="course-page-section">
              <h2 className="course-page-section-title">Leçons</h2>

              {sortedLessons.length === 0 && (
                <p className="course-page-info">
                  Aucune leçon définie pour l’instant. Ajoute une première
                  leçon pour ce cours.
                </p>
              )}

              {sortedLessons.length > 0 && (
                <ol className="course-page-lesson-list">
                  {sortedLessons.map((lesson, index) => (
                    <li
                      key={lesson.id}
                      className="course-page-lesson-item"
                    >
                      <div className="course-page-lesson-header">
                        <span className="course-page-lesson-order">
                          Leçon {lesson.order ?? index + 1}
                        </span>
                        <h3 className="course-page-lesson-title">
                          {lesson.title}
                        </h3>
                        <span className="course-page-tag course-page-tag-type">
                          {lesson.content_type}
                        </span>
                      </div>

                      {lesson.description && (
                        <p className="course-page-lesson-content">
                          {lesson.description.length > 180
                            ? lesson.description.slice(0, 180) + "…"
                            : lesson.description}
                        </p>
                      )}

                      <div className="course-page-lesson-actions">
                        <Link
                          to={`/lessons/${lesson.id}`}
                          className="course-page-btn-outline"
                        >
                          Ouvrir la leçon
                        </Link>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="course-page-section">
              <h2 className="course-page-section-title">Quiz du cours</h2>
              <p className="course-page-info">
                Teste tes connaissances ou configure le quiz associé à ce cours.
              </p>
              <div className="course-page-quiz-actions">
                <Link
                  to={`/courses/${course.id}/quiz/new`}
                  className="course-page-btn-outline"
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
        </div>
      </div>
    </section>
  );
};

export default CourseDetailPage;
