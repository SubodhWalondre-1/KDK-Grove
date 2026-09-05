import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrendsPage from '../../src/features/trends/TrendsPage';
import * as trendsApi from '../../src/api/trendsApi';
import { useProfileStore } from '../../src/store/profileStore';

vi.mock('../../src/api/trendsApi');

describe('TrendsPage Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useProfileStore.setState({
      activeProfile: { id: 1, profile_name: 'Rahul Kumar', species: 'human' },
    });
  });

  const renderComponent = (initialPath = '/profiles/1/trends') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/profiles/:profileId/trends" element={<TrendsPage />} />
          <Route
            path="/profiles/:profileId/trends/:testName"
            element={<div data-testid="detail-page">Detail Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders health-score trend sparkline plus one mini card per item in mocked overview tests[] array', async () => {
    trendsApi.getTrendOverview.mockResolvedValueOnce({
      profile_id: 1,
      health_score_trend: {
        sparkline: [70.0, 80.0, 90.0],
        direction: 'increasing',
        latest_score: 90.0,
        based_on_report_count: 3,
      },
      tests: [
        {
          test_name: 'Hemoglobin',
          latest_value: 14.5,
          latest_unit: 'g/dL',
          latest_status: 'green',
          direction: 'stable',
          sparkline: [14.0, 14.2, 14.5],
          report_count: 3,
        },
        {
          test_name: 'Blood Sugar',
          latest_value: 125.0,
          latest_unit: 'mg/dL',
          latest_status: 'yellow',
          direction: 'increasing',
          sparkline: [100.0, 115.0, 125.0],
          report_count: 3,
        },
      ],
    });

    renderComponent();

    expect(await screen.findByText(/overall health score trend/i)).toBeInTheDocument();
    expect(screen.getByText('90/100')).toBeInTheDocument();

    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('14.5 g/dL')).toBeInTheDocument();

    expect(screen.getByText('Blood Sugar')).toBeInTheDocument();
    expect(screen.getByText('125 mg/dL')).toBeInTheDocument();
  });

  it('shows the "Upload more reports" empty state when tests[] is empty', async () => {
    trendsApi.getTrendOverview.mockResolvedValueOnce({
      profile_id: 1,
      health_score_trend: {
        sparkline: [],
        direction: 'insufficient_data',
        latest_score: null,
        based_on_report_count: 0,
      },
      tests: [],
    });

    renderComponent();

    expect(await screen.findByText(/no trend data available yet/i)).toBeInTheDocument();
    expect(screen.getByText(/upload more reports to start seeing health trends/i)).toBeInTheDocument();
  });

  it('clicking a mini card navigates to the per-test detail route with the correct testName param', async () => {
    trendsApi.getTrendOverview.mockResolvedValueOnce({
      profile_id: 1,
      health_score_trend: {
        sparkline: [80.0, 85.0],
        direction: 'increasing',
        latest_score: 85.0,
        based_on_report_count: 2,
      },
      tests: [
        {
          test_name: 'Hemoglobin',
          latest_value: 14.5,
          latest_unit: 'g/dL',
          latest_status: 'green',
          direction: 'stable',
          sparkline: [14.0, 14.5],
          report_count: 2,
        },
      ],
    });

    renderComponent();

    const card = await screen.findByText('Hemoglobin');
    fireEvent.click(card);

    expect(await screen.findByTestId('detail-page')).toBeInTheDocument();
  });

  it('loading indicator shows while the initial fetch is pending, then resolves to real content', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    trendsApi.getTrendOverview.mockReturnValueOnce(promise);

    renderComponent();

    expect(screen.getByText(/loading health trends/i)).toBeInTheDocument();

    resolvePromise({
      profile_id: 1,
      health_score_trend: {
        sparkline: [75.0],
        direction: 'insufficient_data',
        latest_score: 75.0,
        based_on_report_count: 1,
      },
      tests: [
        {
          test_name: 'Creatinine',
          latest_value: 0.9,
          latest_unit: 'mg/dL',
          latest_status: 'green',
          direction: 'insufficient_data',
          sparkline: [0.9],
          report_count: 1,
        },
      ],
    });

    expect(await screen.findByText('Creatinine')).toBeInTheDocument();
    expect(screen.queryByText(/loading health trends/i)).not.toBeInTheDocument();
  });

  it('limits initial list to 4 items and toggles with "Show More" / "Show Less"', async () => {
    const manyTests = [
      { test_name: 'Basophils', latest_value: 0, latest_unit: '%', latest_status: 'green' },
      { test_name: 'Lymphocytes', latest_value: 15, latest_unit: '%', latest_status: 'green' },
      { test_name: 'Monocytes', latest_value: 7, latest_unit: '%', latest_status: 'green' },
      { test_name: 'Packed Cell Volume (Hematocrit)', latest_value: 43.9, latest_unit: '%', latest_status: 'green' },
      { test_name: 'Platelet Count', latest_value: 2.68, latest_unit: 'lakh', latest_status: 'green' },
      { test_name: 'RDW-CV', latest_value: 15.6, latest_unit: '%', latest_status: 'green' },
    ];

    trendsApi.getTrendOverview.mockResolvedValueOnce({
      profile_id: 1,
      health_score_trend: { sparkline: [80], direction: 'stable', latest_score: 80, based_on_report_count: 1 },
      tests: manyTests,
    });

    renderComponent();

    expect(await screen.findByText('Basophils')).toBeInTheDocument();
    expect(screen.getByText('Lymphocytes')).toBeInTheDocument();
    expect(screen.getByText('Monocytes')).toBeInTheDocument();
    expect(screen.getByText('Packed Cell Volume (Hematocrit)')).toBeInTheDocument();
    // 5th and 6th items should not be visible initially
    expect(screen.queryByText('Platelet Count')).not.toBeInTheDocument();
    expect(screen.queryByText('RDW-CV')).not.toBeInTheDocument();

    // "Show More (+2 more)" button should be present
    const showMoreBtn = screen.getByText(/Show More \(\+2 more\)/i);
    expect(showMoreBtn).toBeInTheDocument();

    // Clicking Show More expands the list
    fireEvent.click(showMoreBtn);
    expect(screen.getByText('Platelet Count')).toBeInTheDocument();
    expect(screen.getByText('RDW-CV')).toBeInTheDocument();
    expect(screen.getByText(/Show Less/i)).toBeInTheDocument();

    // Clicking Show Less collapses it again
    fireEvent.click(screen.getByText(/Show Less/i));
    expect(screen.queryByText('Platelet Count')).not.toBeInTheDocument();
  });

  it('renders translated UI strings and test names when language is Hindi (hi-IN)', async () => {
    const { useUIStore } = await import('../../src/store/uiStore');
    useUIStore.setState({ activeLanguage: 'hi-IN' });

    trendsApi.getTrendOverview.mockResolvedValueOnce({
      profile_id: 1,
      health_score_trend: { sparkline: [85], direction: 'stable', latest_score: 85, based_on_report_count: 1 },
      tests: [
        { test_name: 'Neutrophils', latest_value: 75, latest_unit: '%', latest_status: 'yellow' },
        { test_name: 'Basophils', latest_value: 0, latest_unit: '%', latest_status: 'green' },
      ],
    });

    renderComponent();

    // Wait for TrendsPage data to load by querying a section header inside TrendsPage
    expect(await screen.findByText('प्रमुख निष्कर्ष')).toBeInTheDocument();
    expect(screen.getByText('स्वास्थ्य अवलोकन')).toBeInTheDocument();
    expect(screen.getByText('अच्छा प्रदर्शन')).toBeInTheDocument();
    expect(screen.getByText('सुधार की आवश्यकता')).toBeInTheDocument();
    expect(screen.getAllByText('समीक्षा').length).toBeGreaterThanOrEqual(1);

    // Check translated test names
    expect(screen.getByText('न्यूट्रोफिल्स')).toBeInTheDocument();
    expect(screen.getByText('बेसोफिल्स')).toBeInTheDocument();

    // Reset back to English
    useUIStore.setState({ activeLanguage: 'en-IN' });
  });
});
