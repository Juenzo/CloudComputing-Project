import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

type ContentType = "video" | "pdf" | "word" | "text" | "link";

interface LessonDetail {
  id: number;
  title: string;
  description?: string | null;
  content_type: ContentType;
  content_url?: string | null;
  content_text?: string | null;
  order?: number | null;
  course_id: number;
  content_url_signed?: string; // ajouté par le backend si content_url existe
}

const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!lessonId) return;

    const fetchLesson = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        if (!res.ok) {
          throw new Error("Erreur HTTP " + res.status);
        }
        const data: LessonDetail = await res.json();
        setLesson(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  if (loading) {
    return (
      <section className="course-detail-wrapper">
        <p className="course-detail-info">Chargement de la leçon...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="course-detail-wrapper">
        <p className="course-form-error">
          Impossible de charger la leçon : {error}
        </p>
      </section>
    );
  }

  if (!lesson) {
    return (
      <section className="course-detail-wrapper">
        <p className="course-detail-info">Leçon introuvable.</p>
      </section>
    );
  }

  const fileUrl = lesson.content_url_signed || lesson.content_url || undefined;
  const isText = lesson.content_type === "text";
  const isPdf = lesson.content_type === "pdf";
  const isVideo = lesson.content_type === "video";

  return (
    <section className="course-detail-wrapper">
      <div className="course-detail-topbar">
        <Link
          to={`/courses/${lesson.course_id}`}
          className="course-detail-back"
        >
          ← Retour au cours
        </Link>
      </div>

      <div className="course-detail-card">
        <header className="course-detail-header">
          <div className="course-detail-title-block">
            <h1>{lesson.title}</h1>
            {lesson.order !== null && lesson.order !== undefined && (
              <p className="course-detail-subtitle">
                Leçon n°{lesson.order} du cours
              </p>
            )}
          </div>
        </header>

        <div className="course-detail-body" style={{ gridTemplateColumns: "1fr" }}>
          <div className="course-detail-main">
            {lesson.description && (
              <section className="course-detail-section">
                <h2>Résumé de la leçon</h2>
                <p className="course-detail-description">
                  {lesson.description}
                </p>
              </section>
            )}

            {/* Contenu texte */}
            {isText && lesson.content_text && (
              <section className="course-detail-section">
                <h2>Contenu</h2>
                <div className="course-chapter-content">
                  {lesson.content_text}
                </div>
              </section>
            )}

            {/* Contenu externe (PDF / vidéo / lien) */}
            {!isText && fileUrl && (
              <section className="course-detail-section">
                <h2>Ressource associée</h2>

                {isPdf && (
                  <div className="course-pdf-frame-wrapper">
                    <iframe
                      src={fileUrl}
                      title={`Ressource de la leçon ${lesson.title}`}
                      className="course-pdf-frame"
                    />
                  </div>
                )}

                {isVideo && (
                  <div className="course-pdf-frame-wrapper">
                    <iframe
                      src={fileUrl}
                      title={`Vidéo de la leçon ${lesson.title}`}
                      className="course-pdf-frame"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {!isPdf && !isVideo && (
                  <p className="course-detail-info">
                    Ressource disponible ici :{" "}
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="course-btn-outline"
                    >
                      Ouvrir la ressource
                    </a>
                  </p>
                )}
              </section>
            )}

            {!isText && !fileUrl && (
              <section className="course-detail-section">
                <p className="course-detail-info">
                  Aucune ressource associée n’est disponible pour cette leçon.
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LessonDetailPage;
