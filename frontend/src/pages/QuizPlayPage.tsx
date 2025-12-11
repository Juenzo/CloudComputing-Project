import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../config/api";
import "./css/QuizPlayPage.css";

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
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    setLoading(true);
    setError("");

    apiFetch(`/api/courses/${courseId}/quiz`)
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

        return apiFetch(`/api/quiz/${firstQuizId}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error("Erreur HTTP " + res.status);
            }
            return res.json();
          })
          .then((quizDetail: {
            questions: Array<{
              id: number;
              text: string;
              choices: Array<{ id: number; text: string }>;
            }>;
          }) => {
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
      const payload = Object.entries(selectedAnswers).map(
        ([questionId, answerId]) => ({
          question_id: Number(questionId),
          choice_id: Number(answerId),
        })
      );

      const res = await apiFetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult({ score: data.score, total: data.total_points });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // États simples avec la même carte que le reste
  if (loading) {
    return (
      <section className="quiz-play-wrapper">
        <div className="quiz-play-card">
          <p className="quiz-play-info">Chargement du quiz...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="quiz-play-wrapper">
        <div className="quiz-play-card">
          <p className="course-form-error">Erreur : {error}</p>
        </div>
      </section>
    );
  }

  if (questions.length === 0) {
    return (
      <section className="quiz-play-wrapper">
        <div className="quiz-play-card">
          <p className="quiz-play-info">
            Pas de quiz défini pour ce cours.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-play-wrapper">
      <div className="quiz-play-card">
        <header className="quiz-play-header">
          <h2 className="quiz-play-title">Quiz du cours</h2>
          <p className="quiz-play-subtitle">
            Réponds aux questions ci-dessous, puis valide tes réponses.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="quiz-play-form">
          {questions.map((q, index) => (
            <div key={q.id} className="quiz-play-question-block">
              <h3 className="quiz-play-question-title">
                Question {index + 1} : {q.questionText}
              </h3>

              <div className="quiz-play-answers">
                {q.answers.map((a) => (
                  <label key={a.id} className="quiz-play-answer-row">
                    <input
                      type="radio"
                      name={`${q.id}`}
                      value={`${a.id}`}
                      checked={selectedAnswers[q.id] === a.id}
                      onChange={() => handleSelectAnswer(q.id, a.id)}
                      required
                    />
                    <span className="quiz-play-answer-text">{a.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="quiz-play-actions">
            <button
              type="submit"
              className="course-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Envoi..." : "Valider mes réponses"}
            </button>
          </div>
        </form>

        {result && (
          <p className="quiz-play-result">
            Score : {result.score} / {result.total}
          </p>
        )}
      </div>
    </section>
  );
};

export default QuizPlayPage;
