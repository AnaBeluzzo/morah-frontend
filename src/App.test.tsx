import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('deveMostrarONomeDoSistema', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Morah' })).toBeInTheDocument();
  });
});
