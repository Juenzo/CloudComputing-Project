import React, { useState } from "react";
import { useParams } from "react-router-dom";

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
    { text: "", isCorrect: true },  // par défaut 1ère réponse correcte
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

  const updateAnswerText = (
    qIndex: number,
    aIndex: number,
    text: string
  ) => {
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

  return (
    <div>
      <h2>Créer / éditer le quiz du cours</h2>

      {error && <p className="error">Erreur : {error}</p>}
      {success && <p className="success">{success}</p>}

      <form onSubmit={handleSubmit}>
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="question-block">
            <h3>Question {qIndex + 1}</h3>
            <div className="form-group">
              <label htmlFor={`question-${qIndex}`}>Intitulé de la question</label>
              <input
                id={`question-${qIndex}`}
                value={q.questionText}
                onChange={(e) =>
                  updateQuestionText(qIndex, e.target.value)
                }
                required
                placeholder={`Intitulé de la question ${qIndex + 1}`}
                title={`Intitulé de la question ${qIndex + 1}`}
                aria-label={`Intitulé de la question ${qIndex + 1}`}
              />
            </div>

            <div className="answers">
              <p>Réponses (choisir la bonne)</p>
              {q.answers.map((a, aIndex) => (
                <div key={aIndex} className="answer-row">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={a.isCorrect}
                    onChange={() => setCorrectAnswer(qIndex, aIndex)}
                    title={`Sélectionner la réponse ${aIndex + 1} pour la question ${qIndex + 1}`}
                    aria-label={`Réponse ${aIndex + 1} — Question ${qIndex + 1}`}
                  />
                  <input
                    value={a.text}
                    onChange={(e) =>
                      updateAnswerText(qIndex, aIndex, e.target.value)
                    }
                    required
                    placeholder={`Réponse ${aIndex + 1}`}
                    title={`Texte de la réponse ${aIndex + 1} pour la question ${qIndex + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button type="button" onClick={addQuestion} style={{ marginRight: 8 }}>
          Ajouter une question
        </button>
        <button type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer le quiz"}
        </button>
      </form>
    </div>
  );
};

export default QuizCreatePage;
