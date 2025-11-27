// cloud/frontend/src/App.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// On mock (simule) les appels API pour ne pas avoir besoin du backend lancé
jest.mock('./config/env', () => ({
  API_URL: 'http://localhost:8000/api',
}));

test('renders E-Learning header', () => {
  render(<App />);
  // Adapte ce texte selon ce qui est écrit réellement dans ton Header/MainLayout
  const linkElement = screen.getByText(/E-Learning/i); 
  expect(linkElement).toBeInTheDocument();
});
