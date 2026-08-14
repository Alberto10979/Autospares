import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the autospares dashboard', async () => {
  render(<App />);

  expect(await screen.findByText(/autospares stock dashboard/i)).toBeInTheDocument();
  expect(screen.getByText(/profit and loss/i)).toBeInTheDocument();
  expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
});

test('shows demo data controls in the admin area', async () => {
  render(<App />);

  const adminPanelButton = screen.getByRole('button', { name: /admin panel/i });
  fireEvent.click(adminPanelButton);

  const emailInput = await screen.findByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);

  fireEvent.change(emailInput, {
    target: { value: 'admin@demo.com' },
  });
  fireEvent.change(passwordInput, {
    target: { value: 'demo123' },
  });
  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  expect(await screen.findByRole('button', { name: /adjust cost price/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /data/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /data/i }));

  expect(screen.getByRole('button', { name: /clear all data/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /load demo data/i })).toBeInTheDocument();
});
