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
        // On récupère le cours + ses leçons en parallèle
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

  const sortedLessons = lessons
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
              <h2>Leçons</h2>

              {sortedLessons.length === 0 && (
                <p className="course-detail-info">
                  Aucune leçon définie pour l’instant. Ajoute une première
                  leçon pour ce cours.
                </p>
              )}

              {sortedLessons.length > 0 && (
                <ol className="course-chapter-list">
                  {sortedLessons.map((lesson, index) => (
                    <li key={lesson.id} className="course-chapter-item">
                      <div className="course-chapter-header">
                        <span className="course-chapter-order">
                          Leçon {lesson.order ?? index + 1}
                        </span>
                        <h3>{lesson.title}</h3>
                        <span className="course-tag course-tag-content-type">
                          {lesson.content_type}
                        </span>
                      </div>

                      {lesson.description && (
                        <p className="course-chapter-content">
                          {lesson.description.length > 180
                            ? lesson.description.slice(0, 180) + "..."
                            : lesson.description}
                        </p>
                      )}

                      <div className="course-chapter-actions">
                        <Link
                          to={`/lessons/${lesson.id}`}
                          className="course-btn-outline"
                        >
                          Ouvrir la leçon
                        </Link>
                      </div>
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

          {/* Plus de colonne PDF ici : les contenus sont gérés au niveau des leçons */}
        </div>
      </div>
    </section>
  );
};

export default CourseDetailPage;
