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

    expect(await screen.findByText(/no recommendations generated yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate my recommendations/i })).toBeInTheDocument();
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
      diet: ['Eat leafy greens'],
      foods_to_avoid: ['Avoid processed sugars'],
      exercise: ['Walk 30 mins daily'],
      lifestyle: ['Drink 2L water daily'],
      severity_gate: 'normal',
      generated_at: '2026-08-01T00:00:00Z',
    };

    recommendationsApi.generateRecommendations.mockResolvedValueOnce(generatedResponse);

    renderComponent();

    const generateBtn = await screen.findByRole('button', { name: /generate my recommendations/i });
    fireEvent.click(generateBtn);

    // Verify loading state
    expect(screen.getByText(/analyzing report & synthesizing guidance/i)).toBeInTheDocument();

    // Verify rendered tabs and lifestyle card
    expect(await screen.findByText('Eat leafy greens')).toBeInTheDocument();
    expect(screen.getByText('Avoid processed sugars')).toBeInTheDocument();
    expect(screen.getByText('Daily Wellness Checklist')).toBeInTheDocument();
    expect(screen.getByText('Drink 2L water daily')).toBeInTheDocument();
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
