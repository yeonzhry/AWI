import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the header navigation and the opening scene', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
  expect(screen.getByAltText(/소녀상/i)).toBeInTheDocument();
});
