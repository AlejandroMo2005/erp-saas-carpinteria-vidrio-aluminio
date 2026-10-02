import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SkeletonCard from '../../../../presentation/components/Materiales/MatCard/SkeletonCard';

describe('SkeletonCard', () => {
  it('renderiza la estructura completa del skeleton', () => {
    const { container } = render(<SkeletonCard />);

    const card = container.firstChild;

    expect(card).toHaveClass('mat-card', 'mat-card--skeleton');
    expect(card).toHaveAttribute('aria-hidden', 'true');

    expect(card.querySelector('.skel--header')).toBeInTheDocument();
    expect(card.querySelector('.skel--icon')).toBeInTheDocument();
    expect(card.querySelector('.skel--title')).toBeInTheDocument();
    expect(card.querySelector('.skel--colors')).toBeInTheDocument();
    expect(card.querySelector('.skel--fields')).toBeInTheDocument();
    expect(card.querySelector('.skel--btn')).toBeInTheDocument();

    expect(card.querySelectorAll('.skel')).toHaveLength(6);
  });
});
