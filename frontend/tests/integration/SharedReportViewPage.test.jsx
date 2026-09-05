import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SharedReportViewPage from '../../src/features/sharing/SharedReportViewPage';
import * as sharingApi from '../../src/api/sharingApi';

vi.mock('../../src/api/sharingApi');

describe('SharedReportViewPage Public Guest Flow Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (token = 'valid_token_123') => {
    return render(
      <MemoryRouter initialEntries={[`/shared/${token}`]}>
        <Routes>
          <Route path="/shared/:token" element={<SharedReportViewPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('valid token shows the ViewerGateModal after preview loads successfully', async () => {
    sharingApi.getSharedPreview.mockResolvedValueOnce({
      valid: true,
      report_type: 'Blood Test',
      species_category: 'human',
    });

    renderComponent('valid_token_123');

    expect(await screen.findByText('Welcome to Mediora Guest View')).toBeInTheDocument();
    expect(screen.getByText(/let the report owner know who is viewing/i)).toBeInTheDocument();
  });

  it('expired token shows "This Link Has Expired" state without rendering gate or report content', async () => {
    const error = new Error('Expired');
    error.response = { status: 410, data: { reason: 'expired', detail: 'Share link is no longer valid' } };
    sharingApi.getSharedPreview.mockRejectedValueOnce(error);

    renderComponent('expired_token');

    expect(await screen.findByText('This Link Has Expired')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to Mediora Guest View')).not.toBeInTheDocument();
  });

  it('revoked token shows "Link Revoked by Owner" state with distinct copy', async () => {
    const error = new Error('Revoked');
    error.response = { status: 410, data: { reason: 'revoked', detail: 'Share link is no longer valid' } };
    sharingApi.getSharedPreview.mockRejectedValueOnce(error);

    renderComponent('revoked_token');

    expect(await screen.findByText('Link Revoked by Owner')).toBeInTheDocument();
    expect(screen.queryByText('This Link Has Expired')).not.toBeInTheDocument();
  });

  it('not-found token shows "Link Not Found" state', async () => {
    const error = new Error('Not Found');
    error.response = { status: 404, data: { detail: 'Share link not found' } };
    sharingApi.getSharedPreview.mockRejectedValueOnce(error);

    renderComponent('invalid_token');

    expect(await screen.findByText('Link Not Found')).toBeInTheDocument();
  });

  it('clicking Skip in the gate still calls recordSharedAccess with viewer_name=null', async () => {
    sharingApi.getSharedPreview.mockResolvedValueOnce({
      valid: true,
      report_type: 'Blood Test',
      species_category: 'human',
    });

    sharingApi.recordSharedAccess.mockResolvedValueOnce({
      report_id: 1,
      report_type: 'Blood Test',
      report_date: '2026-01-15',
      profile_name: 'Rahul Kumar',
      species_category: 'human',
      health_score: 85.0,
      test_values: [
        { test_name: 'Hemoglobin', value: 14.5, unit: 'g/dL', ref_low: 12.0, ref_high: 17.5, status: 'green' },
      ],
    });

    renderComponent('valid_token_123');

    const skipBtn = await screen.findByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);

    expect(sharingApi.recordSharedAccess).toHaveBeenCalledWith('valid_token_123', null);
    expect(await screen.findByText("Rahul Kumar's Medical Report")).toBeInTheDocument();
  });

  it('after access is granted, renders read-only report payload without edit controls', async () => {
    sharingApi.getSharedPreview.mockResolvedValueOnce({
      valid: true,
      report_type: 'Lipid Panel',
      species_category: 'human',
    });

    sharingApi.recordSharedAccess.mockResolvedValueOnce({
      report_id: 2,
      report_type: 'Lipid Panel',
      report_date: '2026-02-10',
      profile_name: 'Priya Sharma',
      species_category: 'human',
      health_score: 90.0,
      test_values: [
        { test_name: 'Cholesterol', value: 180.0, unit: 'mg/dL', ref_low: 120.0, ref_high: 200.0, status: 'green' },
      ],
    });

    renderComponent('valid_token_456');

    const continueBtn = await screen.findByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    expect(await screen.findByText("Priya Sharma's Medical Report")).toBeInTheDocument();
    expect(screen.getByText('Cholesterol')).toBeInTheDocument();
    expect(screen.getByText('180 mg/dL')).toBeInTheDocument();

    // Verify absence of authenticated edit/share/delete controls
    expect(screen.queryByRole('button', { name: /reprocess/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit values/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /share report/i })).not.toBeInTheDocument();
  });
});
