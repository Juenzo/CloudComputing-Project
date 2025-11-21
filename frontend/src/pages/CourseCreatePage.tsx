import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CreateCoursePayload {
  title: string;
  description: string;
  category: string;
  level: string;
}

const CourseCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateCoursePayload>({
    title: "",
    description: "",
    category: "",
    level: "beginner",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Erreur HTTP ${res.status}`);
      }

      const created = await res.json();
      
      navigate(`/courses/${created.id}`);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="course-create">
      <div className="course-create-card">
        <div className="course-create-header">
          <h2>Créer un cours</h2>
          <p>
            Commence par créer la structure du cours. Tu pourras ajouter
            les leçons (avec PDF/Vidéo) à l'étape suivante.
          </p>
        </div>

        {error && <p className="course-form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="course-form">
          <div className="course-form-group">
            <label htmlFor="title">Titre du cours</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Ex : Introduction au Cloud Computing"
            />
          </div>

          <div className="course-form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="De quoi parle ce cours ?"
            />
          </div>

          <div className="course-form-row">
            <div className="course-form-group">
              <label htmlFor="category">Catégorie</label>
              <input
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Cloud, DevOps, IA..."
              />
            </div>

            <div className="course-form-group">
              <label htmlFor="level">Niveau</label>
              <select
                id="level"
                name="level"
                value={form.level}
                onChange={handleChange}
              >
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
          </div>

          <div className="course-form-actions">
            <button
              type="submit"
              className="course-btn-primary"
              disabled={loading}
            >
              {loading ? "Création..." : "Créer le cours"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CourseCreatePage;