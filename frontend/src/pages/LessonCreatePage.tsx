// src/pages/LessonCreatePage.tsx
import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import "./css/LessonCreatePage.css";

type ContentType = "video" | "pdf" | "word" | "text" | "link";

interface LessonForm {
  title: string;
  description: string;
  content_type: ContentType;
  content_url: string;   // pour type "link"
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Si l'URL est cassée
  if (!courseId) {
    return (
      <section className="lesson-create-wrapper">
        <div className="lesson-create-card">
          <p className="lesson-form-error">
            ID du cours manquant dans l’URL.
          </p>
        </div>
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
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
      } else if (["pdf", "video", "word"].includes(form.content_type)) {
        if (selectedFile) {
          fd.append("file", selectedFile);
        } else {
          throw new Error(
            "Veuillez sélectionner un fichier pour ce type de leçon."
          );
        }
      } else if (form.content_type === "link") {
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
            message =
              typeof errData.detail === "string"
                ? errData.detail
                : JSON.stringify(errData.detail);
          }
        } catch {
          // on garde le message de base
        }
        throw new Error(message);
      }

      navigate(`/courses/${courseId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isTextContent = form.content_type === "text";
  const isLinkContent = form.content_type === "link";
  const isFileContent = ["pdf", "video", "word"].includes(form.content_type);

  return (
    <section className="lesson-create-wrapper">
      <div className="lesson-create-topbar">
        <Link to={`/courses/${courseId}`} className="lesson-create-back">
          ← Retour au cours
        </Link>
      </div>

      <div className="lesson-create-card">
        <header className="lesson-create-header">
          <div className="lesson-create-title-block">
            <h1 className="lesson-create-title">Ajouter une leçon</h1>
            <p className="lesson-create-subtitle">
              Crée une leçon pour ce cours. Ajoute du texte, un lien externe ou
              téléverse un fichier (PDF, vidéo, Word).
            </p>
          </div>
        </header>

        <div className="lesson-create-body">
          <div className="lesson-create-main">
            {error && <p className="lesson-form-error">{error}</p>}

            <form onSubmit={handleSubmit} className="lesson-form">
              {/* Titre */}
              <div className="lesson-form-group">
                <label htmlFor="title">Titre de la leçon</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Ex : Introduction au Cloud"
                />
              </div>

              {/* Description */}
              <div className="lesson-form-group">
                <label htmlFor="description">Description (optionnelle)</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brève description de la leçon..."
                />
              </div>

              {/* Type + ordre */}
              <div className="lesson-form-row">
                <div className="lesson-form-group">
                  <label htmlFor="content_type">Type de contenu</label>
                  <select
                    id="content_type"
                    name="content_type"
                    value={form.content_type}
                    onChange={(e) => {
                      handleChange(e);
                      setSelectedFile(null);
                    }}
                  >
                    <option value="text">Texte</option>
                    <option value="pdf">Fichier PDF</option>
                    <option value="video">Fichier Vidéo</option>
                    <option value="word">Fichier Word</option>
                    <option value="link">Lien externe (YouTube, site web...)</option>
                  </select>
                </div>

                <div className="lesson-form-group">
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
                <div className="lesson-form-group">
                  <label htmlFor="content_text">Contenu texte</label>
                  <textarea
                    id="content_text"
                    name="content_text"
                    value={form.content_text}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Colle ou rédige ici le contenu de la leçon..."
                  />
                </div>
              )}

              {/* Upload fichier */}
              {isFileContent && (
                <div className="lesson-form-group">
                  <label>
                    Fichier à téléverser (
                    {form.content_type.toUpperCase()})
                  </label>

                  <label
                    htmlFor="lesson-file-upload"
                    className="lesson-file-input-wrapper"
                  >
                    <span className="lesson-file-input-button">
                      Choisir un fichier
                    </span>
                    <span className="lesson-file-input-name">
                      {selectedFile
                        ? selectedFile.name
                        : "Aucun fichier choisi"}
                    </span>
                  </label>

                  <input
                    id="lesson-file-upload"
                    type="file"
                    className="lesson-file-input-hidden"
                    accept={
                      form.content_type === "pdf"
                        ? "application/pdf"
                        : form.content_type === "video"
                        ? "video/*"
                        : ".doc,.docx,application/msword"
                    }
                    onChange={handleFileChange}
                  />

                  <p className="lesson-info-text">
                    Le fichier sera envoyé sur Azure Blob Storage, puis lié à
                    cette leçon.
                  </p>
                </div>
              )}

              {/* Lien externe */}
              {isLinkContent && (
                <div className="lesson-form-group">
                  <label htmlFor="content_url">Lien externe</label>
                  <input
                    id="content_url"
                    name="content_url"
                    value={form.content_url}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                  <p className="lesson-info-text">
                    Colle ici un lien vers une vidéo, une page web, etc.
                  </p>
                </div>
              )}

              <div className="lesson-form-actions">
                <button
                  type="submit"
                  className="lesson-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Envoi en cours..." : "Créer la leçon"}
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
