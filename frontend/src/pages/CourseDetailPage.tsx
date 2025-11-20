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
    <div>
      <h2>{course.title}</h2>

      {course.level && <p><strong>Niveau :</strong> {course.level}</p>}
      {course.category && <p><strong>Catégorie :</strong> {course.category}</p>}
      {course.description && <p>{course.description}</p>}

      <section>
        <h3>Chapitres</h3>
        {course.chapters.length === 0 && <p>Aucun chapitre pour l’instant.</p>}
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
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>Quiz du cours</h3>
        <p>
          <Link to={`/courses/${course.id}/quiz/new`}>
            Créer / éditer le quiz du cours
          </Link>
        </p>
        <p>
          <Link to={`/courses/${course.id}/quiz`}>
            Faire le quiz
          </Link>
        </p>
      </section>
    </div>
  );
};

export default CourseDetailPage;
