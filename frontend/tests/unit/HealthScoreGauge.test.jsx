import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HealthScoreGauge from '../../src/features/healthDashboard/components/HealthScoreGauge';

// Mock GaugeChart to avoid canvas rendering issues in jsdom environment
vi.mock('../../src/charts/GaugeChart', () => ({
  default: ({ value, label }) => (
    <div data-testid="gauge-chart" data-value={value} data-label={label}>
      GaugeChart ({value})
    </div>
  ),
}));

describe('HealthScoreGauge component', () => {
  it('renders without crashing for healthScore=0, 50, 100', () => {
    const { unmount } = render(
      <HealthScoreGauge healthScore={0} healthScoreLabel="Needs Attention" />
    );
    expect(screen.getByTestId('gauge-chart')).toHaveAttribute('data-value', '0');
    unmount();

    const { unmount: unmount50 } = render(
      <HealthScoreGauge healthScore={50} healthScoreLabel="Fair" />
    );
    expect(screen.getByTestId('gauge-chart')).toHaveAttribute('data-value', '50');
    unmount50();

    render(<HealthScoreGauge healthScore={100} healthScoreLabel="Excellent" />);
    expect(screen.getByTestId('gauge-chart')).toHaveAttribute('data-value', '100');
  });

  it('renders the "Not yet scored" state when healthScore=null', () => {
    render(<HealthScoreGauge healthScore={null} healthScoreLabel="No Data" />);
    expect(screen.getByText('Not yet scored')).toBeInTheDocument();
    expect(screen.queryByTestId('gauge-chart')).not.toBeInTheDocument();
  });

  it('displays the correct healthScoreLabel text passed as a prop', () => {
    render(<HealthScoreGauge healthScore={85} healthScoreLabel="Excellent" />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('"View Details" button calls onViewDetails when clicked', () => {
    const handleViewDetails = vi.fn();
    render(
      <HealthScoreGauge
        healthScore={75}
        healthScoreLabel="Good"
        onViewDetails={handleViewDetails}
      />
    );

    const button = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(button);
    expect(handleViewDetails).toHaveBeenCalledTimes(1);
  });
});
