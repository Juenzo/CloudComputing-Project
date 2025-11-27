import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Types locaux pour éviter les erreurs de compilation
type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

interface CreateCoursePayload {
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  slug: string;
}

interface CreateCourseForm {
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
}

interface CourseResponse extends CreateCoursePayload {
  id: string;
}

const CourseCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateCourseForm>({
    title: "",
    description: "",
    category: "Programming", // doit matcher l'Enum côté backend
    level: "Beginner",       // idem
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
      // 👉 Prépare le payload JSON attendu par FastAPI (CourseCreate)
      const payload: CreateCoursePayload = {
        title: form.title,
        description: form.description,
        category: form.category,
        level: form.level,
        // Le backend auto-génère le slug si non fourni, mais on envoie le nôtre
        slug: form.title.toLowerCase().trim().replace(/\s+/g, "-"),
      };

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = `Erreur HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.detail) {
            if (Array.isArray(errData.detail)) {
              message = errData.detail
                .map((d: any) => d.msg || JSON.stringify(d))
                .join(" | ");
            } else if (typeof errData.detail === "string") {
              message = errData.detail;
            } else {
              message = JSON.stringify(errData.detail);
            }
          }
        } catch {
          // ignorer si la réponse erreur n'est pas JSON
        }
        throw new Error(message);
      }

      const created: CourseResponse = await res.json();
      // Redirection vers la page de détail du cours (id numérique côté backend)
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
            Renseigne quelques infos. Le quiz sera ajouté
            ensuite.
            Commence par créer la structure du cours. Tu pourras ajouter
            les leçons (avec PDF/Vidéo) à l&apos;étape suivante.
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
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="Programming">Programmation</option>
                <option value="Cloud">Cloud</option>
                <option value="Data Science">Data Science</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Business">Business</option>
              </select>
            </div>

            <div className="course-form-group">
              <label htmlFor="level">Niveau</label>
              <select
                id="level"
                name="level"
                value={form.level}
                onChange={handleChange}
              >
                <option value="Beginner">Débutant</option>
                <option value="Intermediate">Intermédiaire</option>
                <option value="Advanced">Avancé</option>
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
