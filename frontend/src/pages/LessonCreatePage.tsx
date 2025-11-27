import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

type ContentType = "video" | "pdf" | "word" | "text" | "link";

interface LessonForm {
  title: string;
  description: string;
  content_type: ContentType;
  content_url: string;   // pour PDF / vidéo / lien
  content_text: string;  // pour contenu texte
  order: number;
}

const LessonCreatePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<LessonForm>({
    title: "",
    description: "",
    content_type: "text",
    content_url: "",
    content_text: "",
    order: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  if (!courseId) {
    return (
      <section className="course-detail-wrapper">
        <p className="course-form-error">
          ID du cours manquant dans l’URL.
        </p>
      </section>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "order" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("title", form.title);
      if (form.description) fd.append("description", form.description);
      fd.append("content_type", form.content_type);
      fd.append("order", String(form.order ?? 0));
      fd.append("course_id", String(Number(courseId)));

      if (form.content_type === "text") {
        if (form.content_text) fd.append("content_text", form.content_text);
      } else {
        if (form.content_url) fd.append("content_url", form.content_url);
      }

      const res = await fetch("/api/lessons", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        let message = `Erreur HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.detail) {
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
          // on garde le message de base
        }
        throw new Error(message);
      }

      // On pourrait utiliser la leçon renvoyée, mais ici on revient au cours
      navigate(`/courses/${courseId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isTextContent = form.content_type === "text";
  const isUrlContent =
    form.content_type === "pdf" ||
    form.content_type === "video" ||
    form.content_type === "word" ||
    form.content_type === "link";

  return (
    <section className="course-detail-wrapper">
      <div className="course-detail-topbar">
        <Link to={`/courses/${courseId}`} className="course-detail-back">
          ← Retour au cours
        </Link>
      </div>

      <div className="course-detail-card">
        <header className="course-detail-header">
          <div className="course-detail-title-block">
            <h1>Ajouter une leçon</h1>
            <p className="course-detail-subtitle">
              Crée une leçon pour ce cours. Tu peux choisir un contenu texte
              ou une ressource externe (PDF, vidéo, lien…).
            </p>
          </div>
        </header>

        <div className="course-detail-body">
          <div className="course-detail-main">
            {error && <p className="course-form-error">{error}</p>}

            <form onSubmit={handleSubmit} className="course-form">
              <div className="course-form-group">
                <label htmlFor="title">Titre de la leçon</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Ex : Introduction au modèle IaaS / PaaS / SaaS"
                />
              </div>

              <div className="course-form-group">
                <label htmlFor="description">Description (optionnelle)</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brève description de ce que couvre cette leçon."
                />
              </div>

              <div className="course-form-row">
                <div className="course-form-group">
                  <label htmlFor="content_type">Type de contenu</label>
                  <select
                    id="content_type"
                    name="content_type"
                    value={form.content_type}
                    onChange={handleChange}
                  >
                    <option value="text">Texte</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Vidéo</option>
                    <option value="word">Document Word</option>
                    <option value="link">Lien externe</option>
                  </select>
                </div>

                <div className="course-form-group">
                  <label htmlFor="order">Ordre dans le cours</label>
                  <input
                    id="order"
                    name="order"
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={handleChange}
                    placeholder="0, 1, 2…"
                  />
                </div>
              </div>

              {/* Contenu texte */}
              {isTextContent && (
                <div className="course-form-group">
                  <label htmlFor="content_text">
                    Contenu texte de la leçon
                  </label>
                  <textarea
                    id="content_text"
                    name="content_text"
                    value={form.content_text}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Colle ici le contenu de la leçon, un résumé ou un texte explicatif."
                  />
                </div>
              )}

              {/* URL vers PDF / vidéo / lien */}
              {isUrlContent && (
                <div className="course-form-group">
                  <label htmlFor="content_url">
                    URL du contenu (
                    {form.content_type === "pdf"
                      ? "lien vers le PDF"
                      : form.content_type === "video"
                      ? "lien vers la vidéo"
                      : form.content_type === "word"
                      ? "lien vers le document"
                      : "lien externe"}
                    )
                  </label>
                  <input
                    id="content_url"
                    name="content_url"
                    value={form.content_url}
                    onChange={handleChange}
                    placeholder="https://…"
                  />
                  <p className="course-detail-info">
                    Plus tard, cette URL pourra être une URL signée Azure Blob
                    générée par le backend.
                  </p>
                </div>
              )}

              <div className="course-form-actions">
                <button
                  type="submit"
                  className="course-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Création de la leçon..." : "Créer la leçon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LessonCreatePage;
