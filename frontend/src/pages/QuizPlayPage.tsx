import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface QuizAnswer {
  id: number;
  text: string;
}

interface QuizQuestion {
  id: number;
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
  const [quizId, setQuizId] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    setLoading(true);
    setError("");

    // 1) Charger la liste des quiz du cours
    fetch(`/api/courses/${courseId}/quiz`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur HTTP " + res.status);
        }
        return res.json();
      })
      .then((quizList: Array<{ id: number; title: string }>) => {
        if (!quizList || quizList.length === 0) {
          setQuestions([]);
          return;
        }
        const firstQuizId = quizList[0].id;
        setQuizId(firstQuizId);
        // 2) Charger le détail du quiz (questions + choix)
        return fetch(`/api/quiz/${firstQuizId}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error("Erreur HTTP " + res.status);
            }
            return res.json();
          })
          .then((quizDetail: { questions: Array<{ id: number; text: string; choices: Array<{ id: number; text: string }> }> }) => {
            const mapped: QuizQuestion[] = quizDetail.questions.map((q) => ({
              id: q.id,
              questionText: q.text,
              answers: q.choices.map((c) => ({ id: c.id, text: c.text })),
            }));
            setQuestions(mapped);
          });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSelectAnswer = (questionId: number, answerId: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId) return;

    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const payload = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
        question_id: Number(questionId),
        choice_id: Number(answerId),
      }));

      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const data = await res.json();
      // Backend renvoie: { score, total_points, passed, details }
      setResult({ score: data.score, total: data.total_points });
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
                  name={`${q.id}`}
                  value={`${a.id}`}
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
