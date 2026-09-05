import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../../src/components/StatusBadge';

describe('StatusBadge component', () => {
  it('renders success-token styling and default label for status="green"', () => {
    render(<StatusBadge status="green" />);
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('renders warning-token styling and default label for status="yellow"', () => {
    render(<StatusBadge status="yellow" />);
    expect(screen.getByText('Borderline')).toBeInTheDocument();
  });

  it('renders danger-token styling and default label for status="red"', () => {
    render(<StatusBadge status="red" />);
    expect(screen.getByText('Abnormal')).toBeInTheDocument();
  });

  it('renders neutral styling + "Unknown" label for status=null', () => {
    render(<StatusBadge status={null} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('custom label prop overrides the default text', () => {
    render(<StatusBadge status="red" label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });
});
