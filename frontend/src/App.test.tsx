import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./config/env', () => ({
  API_URL: 'http://localhost:8000/api',
}));

test('renders Maxi-learning header', () => {
  render(<App />);
  const linkElement = screen.getByText(/Maxi-learning/i); 
  expect(linkElement).toBeInTheDocument();
});
