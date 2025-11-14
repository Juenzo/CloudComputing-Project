import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type CourseLevel = "beginner" | "intermediate" | "advanced";

interface CreateCoursePayload {
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

  const [form, setForm] = useState<CreateCoursePayload>({
    title: "",
    description: "",
    category: "",
    level: "beginner",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const created: CourseResponse = await res.json();

      // Redirige vers la page détail du cours
      navigate(`/courses/${created.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Créer un cours</h2>

      {error && <p className="error">Erreur : {error}</p>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Catégorie</label>
          <input
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Cloud, DevOps, etc."
          />
        </div>

        <div className="form-group">
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

        <button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer le cours"}
        </button>
      </form>
    </div>
  );
};

export default CourseCreatePage;
