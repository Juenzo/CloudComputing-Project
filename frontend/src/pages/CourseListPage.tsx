import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CourseListPage.css";

export type CourseSummary = {
  id: number;
  title: string;
  level?: string;
  description?: string;
  category?: string;
  lessonCount?: number;
};

const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
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

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="catalog-wrapper">
      {/* Bloc titre + description */}
      <div className="catalog-header">
        <h1>Catalogue des cours</h1>
        <p>
          Parcours les cours disponibles et trouve celui qui correspond à ton
          niveau et à tes objectifs.
        </p>
      </div>

      {/* Carte de recherche */}
      <div className="catalog-search-card">
        <label htmlFor="course-search" className="catalog-search-label">
          Rechercher un cours
        </label>
        <div className="catalog-search-input-wrapper">
          <span className="catalog-search-icon">🔍</span>
          <input
            id="course-search"
            type="text"
            placeholder="Titre du cours, catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="catalog-search-input"
          />
        </div>
      </div>

      {/* Messages info */}
      {loading && (
        <p className="catalog-info-text">Chargement des cours en cours...</p>
      )}
      {error && (
        <p className="course-form-error">
          Impossible de charger les cours : {error}
        </p>
      )}

      {/* Liste des cours */}
      {!loading && !error && (
        <>
          {filteredCourses.length === 0 ? (
            <p className="catalog-info-text">
              Aucun cours ne correspond à ta recherche.
            </p>
          ) : (
            <div className="catalog-grid">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="catalog-card"
                >
                  <div className="catalog-card-top">
                    <h3 className="catalog-card-title">{course.title}</h3>

                    <div className="catalog-card-tags">
                      {course.level && (
                        <span className="catalog-tag catalog-tag-level">
                          {course.level}
                        </span>
                      )}
                      {course.category && (
                        <span className="catalog-tag catalog-tag-category">
                          {course.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {course.description && (
                    <p className="catalog-card-description">
                      {course.description.length > 130
                        ? course.description.slice(0, 130) + "..."
                        : course.description}
                    </p>
                  )}

                  <div className="catalog-card-bottom">
                    <span className="catalog-lessons">
                      {(course.lessonCount ?? 0) || 0} leçon(s)
                    </span>
                    <span className="catalog-link">Voir le cours →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default CourseListPage;
