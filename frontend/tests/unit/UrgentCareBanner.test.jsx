import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UrgentCareBanner from '../../src/features/recommendations/components/UrgentCareBanner';
import { colors } from '../../src/theme/colors';

describe('UrgentCareBanner component', () => {
  const urgentMessage = 'One or more of your values show a severe deviation from the normal range.';

  it('renders the passed message prop text', () => {
    render(<UrgentCareBanner message={urgentMessage} />);

    expect(screen.getByText(urgentMessage)).toBeInTheDocument();
    expect(screen.getByText(/urgent medical consultation recommended/i)).toBeInTheDocument();
  });

  it('renders with danger-token styling from theme/colors.js', () => {
    const { container } = render(<UrgentCareBanner message={urgentMessage} />);

    const outerContainer = container.firstChild;
    expect(outerContainer).toHaveStyle(`border: 2px solid ${colors.danger}`);
  });

  it('does not render any dismiss or close button in the DOM', () => {
    render(<UrgentCareBanner message={urgentMessage} />);

    const buttons = screen.queryAllByRole('button');
    const dismissButtons = buttons.filter(
      (btn) =>
        btn.getAttribute('aria-label')?.toLowerCase().includes('close') ||
        btn.getAttribute('aria-label')?.toLowerCase().includes('dismiss') ||
        btn.textContent?.toLowerCase().includes('close') ||
        btn.textContent?.toLowerCase().includes('dismiss') ||
        btn.textContent?.includes('✕')
    );

    expect(dismissButtons.length).toBe(0);
  });
});
