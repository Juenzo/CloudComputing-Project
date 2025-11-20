import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface QuizAnswer {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  answers: QuizAnswer[];
}

interface QuizResult {
  score: number;
  total: number;
}

const QuizPlayPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    setLoading(true);
    setError("");

    fetch(`/api/courses/${courseId}/quiz`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur HTTP " + res.status);
        }
        return res.json();
      })
      .then((data: { questions: QuizQuestion[] }) => {
        setQuestions(data.questions);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSelectAnswer = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        answers: Object.entries(selectedAnswers).map(
          ([questionId, answerId]) => ({
            questionId,
            answerId,
          })
        ),
      };

      const res = await fetch(`/api/courses/${courseId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const data: QuizResult = await res.json();
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Chargement du quiz...</p>;
  if (error) return <p className="error">Erreur : {error}</p>;
  if (questions.length === 0) return <p>Pas de quiz défini pour ce cours.</p>;

  return (
    <div>
      <h2>Quiz du cours</h2>

      <form onSubmit={handleSubmit}>
        {questions.map((q, index) => (
          <div key={q.id} className="question-block">
            <h3>
              Question {index + 1} : {q.questionText}
            </h3>

            {q.answers.map((a) => (
              <label key={a.id} className="answer-row">
                <input
                  type="radio"
                  name={q.id}
                  value={a.id}
                  checked={selectedAnswers[q.id] === a.id}
                  onChange={() => handleSelectAnswer(q.id, a.id)}
                  required
                />
                {a.text}
              </label>
            ))}
          </div>
        ))}

        <button type="submit" disabled={submitting}>
          {submitting ? "Envoi..." : "Valider mes réponses"}
        </button>
      </form>

      {result && (
        <p style={{ marginTop: "1rem" }}>
          Score : {result.score} / {result.total}
        </p>
      )}
    </div>
  );
};

export default QuizPlayPage;
