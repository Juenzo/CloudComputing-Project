import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";

interface AnswerForm {
  text: string;
  isCorrect: boolean;
}

interface QuestionForm {
  questionText: string;
  answers: AnswerForm[];
}

const createEmptyQuestion = (): QuestionForm => ({
  questionText: "",
  answers: [
    { text: "", isCorrect: true }, // par défaut 1ère réponse correcte
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

const QuizCreatePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [questions, setQuestions] = useState<QuestionForm[]>([
    createEmptyQuestion(),
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const updateQuestionText = (index: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, questionText: text } : q))
    );
  };

  const updateAnswerText = (qIndex: number, aIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return {
          ...q,
          answers: q.answers.map((a, j) =>
            j === aIndex ? { ...a, text } : a
          ),
        };
      })
    );
  };

  const setCorrectAnswer = (qIndex: number, aIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return {
          ...q,
          answers: q.answers.map((a, j) => ({
            ...a,
            isCorrect: j === aIndex,
          })),
        };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseId) {
      setError("ID du cours manquant.");
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // Adapter le payload au format attendu par l'API backend
      const payload = {
        title: "Quiz", // titre requis par QuizCreate
        description: null,
        order: 0,
        course_id: Number(courseId),
        questions: questions.map((q) => ({
          text: q.questionText,
          points: 1,
          choices: q.answers.map((a) => ({
            text: a.text,
            is_correct: a.isCorrect,
          })),
        })),
      };
      const res = await fetch(`/api/courses/${courseId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      setSuccess("Quiz enregistré avec succès !");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // si pas de courseId dans l'URL
  if (!courseId) {
    return (
      <section className="course-detail-wrapper">
        <div className="course-detail-card">
          <p className="course-form-error">ID du cours manquant dans l’URL.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="course-detail-wrapper">
      <div className="course-detail-topbar">
        <Link to={`/courses/${courseId}`} className="course-detail-back">
          ← Retour au cours
        </Link>
      </div>

      <div className="course-detail-card">
        {/* HEADER */}
        <header className="course-detail-header">
          <div className="course-detail-title-block">
            <h1>Configurer le quiz</h1>
            <p className="course-detail-subtitle">
              Crée des questions à choix multiples pour évaluer les
              connaissances sur ce cours.
            </p>
          </div>
        </header>

        {/* BODY */}
        <div className="course-detail-body">
          <div className="course-detail-main">
            {error && <p className="course-form-error">{error}</p>}
            {success && (
              <p className="course-form-success">{success}</p>
            )}

            <form onSubmit={handleSubmit} className="course-form">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="quiz-question-card">
                  <div className="quiz-question-header">
                    <span className="quiz-question-pill">
                      Question {qIndex + 1}
                    </span>
                  </div>

                  <div className="course-form-group">
                    <label htmlFor={`question-${qIndex}`}>
                      Intitulé de la question
                    </label>
                    <input
                      id={`question-${qIndex}`}
                      value={q.questionText}
                      onChange={(e) =>
                        updateQuestionText(qIndex, e.target.value)
                      }
                      required
                      placeholder={`Intitulé de la question ${qIndex + 1}`}
                    />
                  </div>

                  <div className="quiz-answers">
                    <p className="quiz-answers-title">
                      Réponses (sélectionne la bonne)
                    </p>
                    {q.answers.map((a, aIndex) => (
                      <div key={aIndex} className="quiz-answer-row">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={a.isCorrect}
                          onChange={() =>
                            setCorrectAnswer(qIndex, aIndex)
                          }
                          className="quiz-answer-radio"
                          title={`Sélectionner la réponse ${aIndex + 1} comme correcte`}
                          aria-label={`Sélectionner la réponse ${aIndex + 1} comme correcte`}
                        />
                        <input
                          value={a.text}
                          onChange={(e) =>
                            updateAnswerText(
                              qIndex,
                              aIndex,
                              e.target.value
                            )
                          }
                          required
                          placeholder={`Réponse ${aIndex + 1}`}
                          className="quiz-answer-input"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="course-form-actions quiz-actions">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="course-btn-outline"
                >
                  + Ajouter une question
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="course-btn-primary"
                >
                  {saving ? "Enregistrement..." : "Enregistrer le quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuizCreatePage;
