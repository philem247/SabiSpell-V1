import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Wordmark from './Wordmark';

it('renders both halves and size', () => {
  const { container } = render(<Wordmark size={48} />);
  expect(screen.getByText('Sabi')).toBeInTheDocument();
  expect(screen.getByText('Spell')).toBeInTheDocument();
  expect(container.firstChild).toHaveStyle({ fontSize: '48px' });
});
