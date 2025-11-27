import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

type ContentType = "video" | "pdf" | "word" | "text" | "link";

interface LessonForm {
  title: string;
  description: string;
  content_type: ContentType;
  content_url: string;   // Reste utilisé pour le type "link"
  content_text: string;  // Pour contenu texte
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

  // NOUVEAU : État pour stocker le fichier sélectionné
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

if (!courseId) {
  return (
    <section className="course-detail-wrapper">
      <div className="course-detail-card">
        <p className="course-form-error">
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

  // NOUVEAU : Gestion du changement de fichier
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

      // Logique modifiée :
      if (form.content_type === "text") {
        if (form.content_text) fd.append("content_text", form.content_text);
      } 
      // Si c'est un fichier (PDF, Vidéo, Word), on envoie le fichier
      else if (["pdf", "video", "word"].includes(form.content_type)) {
        if (selectedFile) {
          fd.append("file", selectedFile);
        } else {
           // On peut décider de bloquer si aucun fichier n'est mis, ou laisser passer
           throw new Error("Veuillez sélectionner un fichier pour ce type de leçon.");
        }
      } 
      // Si c'est un lien externe pur, on envoie l'URL textuelle
      else if (form.content_type === "link") {
        if (form.content_url) fd.append("content_url", form.content_url);
      }

      const res = await fetch("/api/lessons", {
        method: "POST",
        body: fd, // Le navigateur gère automatiquement le Content-Type multipart/form-data
      });

      if (!res.ok) {
        let message = `Erreur HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.detail) {
            message = typeof errData.detail === "string" 
              ? errData.detail 
              : JSON.stringify(errData.detail);
          }
        } catch { }
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
  // On distingue maintenant le mode "Lien externe" du mode "Upload Fichier"
  const isLinkContent = form.content_type === "link";
  const isFileContent = ["pdf", "video", "word"].includes(form.content_type);

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
              Crée une leçon pour ce cours. Ajoute du texte, un lien ou téléverse un fichier (PDF, Vidéo).
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
                  placeholder="Ex : Introduction au Cloud"
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
                  placeholder="Brève description..."
                />
              </div>

              <div className="course-form-row">
                <div className="course-form-group">
                  <label htmlFor="content_type">Type de contenu</label>
                  <select
                    id="content_type"
                    name="content_type"
                    value={form.content_type}
                    onChange={(e) => {
                        handleChange(e);
                        // Reset du fichier si on change de type
                        setSelectedFile(null); 
                    }}
                  >
                    <option value="text">Texte</option>
                    <option value="pdf">Fichier PDF</option>
                    <option value="video">Fichier Vidéo</option>
                    <option value="word">Fichier Word</option>
                    <option value="link">Lien externe (Youtube, Web...)</option>
                  </select>
                </div>

                <div className="course-form-group">
                  <label htmlFor="order">Ordre</label>
                  <input
                    id="order"
                    name="order"
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Cas 1 : Texte */}
              {isTextContent && (
                <div className="course-form-group">
                  <label htmlFor="content_text">Contenu texte</label>
                  <textarea
                    id="content_text"
                    name="content_text"
                    value={form.content_text}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Contenu de la leçon..."
                  />
                </div>
              )}

              {/* Cas 2 : Upload de Fichier (PDF, Vidéo, Word) */}
              {isFileContent && (
                <div className="course-form-group">
                  <label>Fichier à téléverser ({form.content_type.toUpperCase()})</label>
                  {/* Utilisation de vos classes CSS existantes pour faire joli */}
                  <label htmlFor="file-upload" className="file-input-wrapper">
                    <span className="file-input-button">Choisir un fichier</span>
                    <span className="file-input-name">
                        {selectedFile ? selectedFile.name : "Aucun fichier choisi"}
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="file-input-hidden"
                    accept={
                        form.content_type === 'pdf' ? "application/pdf" :
                        form.content_type === 'video' ? "video/*" :
                        ".doc,.docx,application/msword"
                    }
                    onChange={handleFileChange}
                  />
                  <p className="course-detail-info">
                    Le fichier sera envoyé sur Azure Blob Storage.
                  </p>
                </div>
              )}

              {/* Cas 3 : Lien simple */}
              {isLinkContent && (
                <div className="course-form-group">
                  <label htmlFor="content_url">Lien externe</label>
                  <input
                    id="content_url"
                    name="content_url"
                    value={form.content_url}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="course-form-actions">
                <button
                  type="submit"
                  className="course-btn-primary"
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