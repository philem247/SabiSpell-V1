import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Mascot from './Mascot';

it('renders default pose at 160', () => {
  render(<Mascot />);
  const img = screen.getByAltText('Ajala the owl');
  expect(img).toHaveAttribute('width', '160');
});

it('renders pose alt and size', () => {
  render(<Mascot pose="sad" size={64} />);
  const img = screen.getByAltText('Ajala the owl, sad');
  expect(img).toHaveAttribute('width', '64');
  expect(img).toHaveAttribute('height', '64');
});

it('each pose has a distinct src', () => {
  const poses = ['standard', 'happy', 'sad', 'streak', 'graduation'] as const;
  const srcs = poses.map((p) => {
    const { container, unmount } = render(<Mascot pose={p} />);
    const src = container.querySelector('img')!.getAttribute('src');
    unmount();
    return src;
  });
  expect(new Set(srcs).size).toBe(5);
});
