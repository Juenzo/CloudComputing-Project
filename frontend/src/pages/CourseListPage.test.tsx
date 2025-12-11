import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CourseListPage from './CourseListPage';
import { API_BASE_URL } from '../config/env';


// On simule fetch globalement avant les tests
global.fetch = jest.fn();

describe('CourseListPage', () => {
  
  // Reset des mocks avant chaque test
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('Affiche les cours après chargement', async () => {
    const fakeCourses = [
      { id: 1, title: 'Introduction au Cloud', description: 'Bases du cloud', level: 'Beginner', category: 'Cloud' },
      { id: 2, title: 'React Avancé', description: 'Pour les pros', level: 'Advanced', category: 'Programming' },
    ];

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === `${API_BASE_URL}/api/courses`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeCourses),
        });
      }
      if (typeof url === 'string' && url.includes('/lessons')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <BrowserRouter>
        <CourseListPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Chargement des cours/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Introduction au Cloud')).toBeInTheDocument();
      expect(screen.getByText('React Avancé')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  test('Le filtre de recherche fonctionne', async () => {
    const fakeCourses = [
      { id: 1, title: 'Python', category: 'Backend' },
      { id: 2, title: 'CSS Master', category: 'Frontend' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fakeCourses),
    });

    render(
      <BrowserRouter>
        <CourseListPage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Python')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Titre du cours/i);
    fireEvent.change(searchInput, { target: { value: 'CSS' } });

    expect(screen.queryByText('Python')).not.toBeInTheDocument();
    expect(screen.getByText('CSS Master')).toBeInTheDocument();
  });

  test('Gère les erreurs API', async () => {
    // On simule une erreur serveur
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(
      <BrowserRouter>
        <CourseListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger les cours/i)).toBeInTheDocument();
    });
  });
});