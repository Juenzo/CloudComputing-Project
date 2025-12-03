import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuizPlayPage from './QuizPlayPage';

global.fetch = jest.fn();

describe('QuizPlayPage', () => {
  const fakeQuizDetail = {
    id: 99,
    title: "Quiz Test",
    questions: [
      {
        id: 1,
        text: "Question 1 ?",
        choices: [
          { id: 10, text: "Réponse A" },
          { id: 11, text: "Réponse B" }
        ]
      }
    ]
  };

  const fakeQuizList = [
    { id: 99, title: "Quiz Test" }
  ];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('Affiche le quiz et permet de soumettre', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
        
        if(url.endsWith('/submit')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ passed: true, score: 1, total_points: 1 })
            });
        }

        if (url.includes('/courses/') && url.endsWith('/quiz')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(fakeQuizList)
            });
        }

        if (url.includes('/api/quiz/')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(fakeQuizDetail)
            });
        }

        return Promise.reject(new Error("URL inconnue dans le mock: " + url));
    });

    render(
      <MemoryRouter initialEntries={['/courses/1/quiz']}>
         <Routes>
             <Route path="/courses/:courseId/quiz" element={<QuizPlayPage />} />
         </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => expect(screen.getByText(/Question 1 \?/i)).toBeInTheDocument());

    const choiceA = screen.getByText("Réponse A");
    fireEvent.click(choiceA);

    const submitBtn = screen.getByText(/Valider mes réponses/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
        expect(screen.getByText(/Score :/i)).toBeInTheDocument();
    });
  });
});