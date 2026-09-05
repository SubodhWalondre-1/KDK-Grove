import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExplanationModal from '../../src/features/explanations/components/ExplanationModal';
import * as explanationsApi from '../../src/api/explanationsApi';

vi.mock('../../src/api/explanationsApi');

describe('ExplanationModal Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does NOT call getExplanation while open=false, calls only when open becomes true', () => {
    explanationsApi.getExplanation.mockResolvedValue({ explanation_text: 'Test text' });

    const { rerender } = render(
      <ExplanationModal
        reportId={1}
        valueId={10}
        testName="Hemoglobin"
        open={false}
        onOpenChange={() => {}}
      />
    );

    // Assert lazy fetch requirement: NO call fired while closed
    expect(explanationsApi.getExplanation).not.toHaveBeenCalled();

    // Rerender with open=true
    rerender(
      <ExplanationModal
        reportId={1}
        valueId={10}
        testName="Hemoglobin"
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(explanationsApi.getExplanation).toHaveBeenCalledWith(1, 10);
  });

  it('shows a loading state while pending, then renders explanation_text on resolution', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    explanationsApi.getExplanation.mockReturnValue(promise);

    render(
      <ExplanationModal
        reportId={1}
        valueId={10}
        testName="Creatinine"
        open={true}
        onOpenChange={() => {}}
      />
    );

    // Loading state is present
    expect(screen.getByText(/fetching explanation\.\.\./i)).toBeInTheDocument();

    resolvePromise({ explanation_text: 'Creatinine measures kidney filtration rate.' });

    expect(await screen.findByText('Creatinine measures kidney filtration rate.')).toBeInTheDocument();
    expect(screen.queryByText(/fetching explanation\.\.\./i)).not.toBeInTheDocument();
  });

  it('always renders the fixed disclaimer text regardless of explanation content', async () => {
    explanationsApi.getExplanation.mockResolvedValue({
      explanation_text: 'Platelets are involved in blood clotting.',
    });

    render(
      <ExplanationModal
        reportId={1}
        valueId={12}
        testName="Platelets"
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(await screen.findByText('Platelets are involved in blood clotting.')).toBeInTheDocument();
    expect(
      screen.getByText(/general information only — not a diagnosis\. talk to a doctor or vet/i)
    ).toBeInTheDocument();
  });

  it('shows a defensive error state when the API call rejects', async () => {
    const error = new Error('Network Error');
    error.response = { status: 404, data: { detail: 'Test value not found' } };
    explanationsApi.getExplanation.mockRejectedValue(error);

    render(
      <ExplanationModal
        reportId={1}
        valueId={99}
        testName="Unknown Test"
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(await screen.findByText('Test value not found')).toBeInTheDocument();
  });
});
