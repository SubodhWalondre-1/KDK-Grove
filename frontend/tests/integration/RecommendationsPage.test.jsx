import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecommendationsPage from '../../src/features/recommendations/RecommendationsPage';
import * as recommendationsApi from '../../src/api/recommendationsApi';

vi.mock('../../src/api/recommendationsApi');

describe('RecommendationsPage Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/reports/1/recommendations']}>
        <Routes>
          <Route path="/reports/:reportId/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows the "Generate My Recommendations" empty state when has_been_generated is false', async () => {
    recommendationsApi.getRecommendations.mockResolvedValueOnce({
      report_id: 1,
      has_been_generated: false,
      is_urgent: false,
      urgent_care_message: null,
      diet: [],
      foods_to_avoid: [],
      exercise: [],
      lifestyle: [],
      severity_gate: null,
      generated_at: null,
    });

    renderComponent();

    expect(await screen.findByText(/no insights generated yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate ai insights/i })).toBeInTheDocument();
  });

  it('clicking Generate shows a loading state, then renders RecommendationTabs + LifestyleSuggestionsCard on success', async () => {
    recommendationsApi.getRecommendations.mockResolvedValueOnce({
      report_id: 1,
      has_been_generated: false,
      is_urgent: false,
      urgent_care_message: null,
      diet: [],
      foods_to_avoid: [],
      exercise: [],
      lifestyle: [],
      severity_gate: null,
      generated_at: null,
    });

    const generatedResponse = {
      report_id: 1,
      has_been_generated: true,
      is_urgent: false,
      urgent_care_message: null,
      summary: { attention: 1, monitoring: 0, normal: 0 },
      findings: [
        {
          id: 1,
          parameter: 'Glucose',
          value: '140',
          unit: 'mg/dL',
          reference_range: '70-99',
          status: 'high',
          clinical_significance: 'Elevated fasting glucose indicates prediabetes.',
        },
      ],
      recommendations: [
        {
          id: 1,
          finding_title: 'Glucose (High)',
          priority: 'attention',
          guidance: 'Eat leafy greens and avoid processed sugars.',
          action_items: [
            { id: 'a1', title: 'Daily Wellness Checklist', description: 'Drink 2L water daily' },
          ],
        },
      ],
      sources: [],
    };

    recommendationsApi.generateRecommendations.mockResolvedValueOnce(generatedResponse);

    renderComponent();

    const generateBtn = await screen.findByRole('button', { name: /generate ai insights/i });
    fireEvent.click(generateBtn);

    // Verify loading state
    expect(screen.getByText(/analyzing findings & retrieving evidence/i)).toBeInTheDocument();

    // Verify rendered findings
    expect(await screen.findByText('Glucose')).toBeInTheDocument();
    expect(screen.getByText(/140/)).toBeInTheDocument();
  });

  it('when response has is_urgent=true, renders UrgentCareBanner instead of RecommendationTabs', async () => {
    const urgentMessage = 'Severe deviation detected in lab results.';

    recommendationsApi.getRecommendations.mockResolvedValueOnce({
      report_id: 1,
      has_been_generated: true,
      is_urgent: true,
      urgent_care_message: urgentMessage,
      diet: [],
      foods_to_avoid: [],
      exercise: [],
      lifestyle: [],
      severity_gate: 'critical',
      generated_at: '2026-08-01T00:00:00Z',
    });

    renderComponent();

    expect(await screen.findByText(urgentMessage)).toBeInTheDocument();
    expect(screen.getByText(/urgent medical consultation recommended/i)).toBeInTheDocument();

    // Assert RecommendationTabs is NOT in the document
    expect(screen.queryByRole('button', { name: /diet plan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /exercise/i })).not.toBeInTheDocument();
  });

  it('shows an error state if the initial fetch fails', async () => {
    recommendationsApi.getRecommendations.mockRejectedValueOnce({
      response: { data: { detail: 'Network connection failed' } },
    });

    renderComponent();

    expect(await screen.findByText('Network connection failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
