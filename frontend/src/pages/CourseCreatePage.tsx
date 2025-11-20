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

  const [pdfFile, setPdfFile] = useState<File | null>(null);
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

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPdfFile(file);
    // pour debug : console.log(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔴 Pour l’instant on n’envoie que les infos texte.
      // Le PDF pourra être géré plus tard via FormData ou un endpoint dédié.
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const created: CourseResponse = await res.json();
      // TODO backend: associer pdfFile au cours created.id si besoin

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
            Renseigne les informations principales du cours. Tu pourras ajouter
            les chapitres et le quiz ensuite.
          </p>
        </div>

        {error && <p className="course-form-error">Erreur : {error}</p>}

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
              placeholder="Explique en quelques lignes ce que l’on va apprendre…"
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
                placeholder="Cloud, DevOps, IA…"
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

<div className="course-form-group">
  <label>Ressource PDF (optionnel)</label>

  <label htmlFor="pdf" className="file-input-wrapper">
    <span className="file-input-button">Choisir un PDF</span>
    <span className="file-input-name">
      {pdfFile ? pdfFile.name : "Aucun fichier sélectionné"}
    </span>
  </label>

  <input
    id="pdf"
    type="file"
    accept="application/pdf"
    onChange={handlePdfChange}
    className="file-input-hidden"
  />
</div>


          <div className="course-form-actions">
            <button
              type="submit"
              className="course-btn-primary"
              disabled={loading}
            >
              {loading ? "Création en cours..." : "Créer le cours"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CourseCreatePage;
