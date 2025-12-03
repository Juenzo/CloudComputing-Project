import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CourseCreatePage from './CourseCreatePage';

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

global.fetch = jest.fn();

describe('CourseCreatePage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockedNavigate.mockClear();
  });

  test('Permet de créer un cours', async () => {
    // On simule une réponse positive du serveur
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 123, title: 'Nouveau Cours' }),
    });

    render(
      <BrowserRouter>
        <CourseCreatePage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Titre du cours/i), { target: { value: 'Nouveau Cours' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Description test' } });

    const button = screen.getByRole('button', { name: /Créer le cours/i });
    fireEvent.click(button);

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/courses', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Nouveau Cours')
        }));
    });

    await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith('/courses/123');
    });
  });
});