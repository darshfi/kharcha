import { render, screen } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import App from '../App';

vi.mock('../services/supabase', () => ({ supabase: {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
} }));

it('redirects unauthenticated visitors to the sign-in screen', async () => {
  window.history.replaceState(null, '', '/');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
});
