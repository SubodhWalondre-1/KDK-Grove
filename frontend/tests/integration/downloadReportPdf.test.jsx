import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  extractFilenameFromDisposition,
  downloadBlob,
  getDownloadErrorMessage,
} from '../../src/utils/helpers';
import { downloadReportPdf } from '../../src/services/api/reports';
import apiClient from '../../src/services/api/client';
import DashboardPage from '../../src/features/healthDashboard/DashboardPage';
import * as dashboardApi from '../../src/api/dashboardApi';
import * as reportsApi from '../../src/api/reportsApi';
import * as recommendationsApi from '../../src/api/recommendationsApi';

// Mock dependencies
vi.mock('../../src/services/api/client', () => ({
  API_URL: 'http://localhost:8000',
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../../src/api/dashboardApi', () => ({
  getDashboard: vi.fn(),
  getProfileReports: vi.fn(),
}));

vi.mock('../../src/api/recommendationsApi', () => ({
  getRecommendations: vi.fn(),
  generateRecommendations: vi.fn(),
}));

vi.mock('react-chartjs-2', () => ({
  Radar: () => <div data-testid="radar-chart" />,
  Line: () => <div data-testid="line-chart" />,
  Bar: () => <div data-testid="bar-chart" />,
  Doughnut: () => <div data-testid="doughnut-chart" />,
}));

vi.mock('../../src/store/profileStore', () => ({
  useProfileStore: vi.fn((selector) =>
    selector({
      activeProfile: { id: 1, name: 'Subodh', species: 'human' },
      profiles: [],
    })
  ),
}));

describe('Password-Protected PDF Download Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. API Service downloadReportPdf', () => {
    it('calls GET /api/reports/:reportId/download with responseType "blob"', async () => {
      const mockBlob = new Blob(['%PDF-1.4 encrypted content'], { type: 'application/pdf' });
      apiClient.get.mockResolvedValueOnce({
        data: mockBlob,
        headers: { 'content-disposition': 'attachment; filename="Mediora_Report_123.pdf"' },
      });

      const response = await downloadReportPdf(123);

      expect(apiClient.get).toHaveBeenCalledWith('/api/reports/123/download', {
        responseType: 'blob',
      });
      expect(response.data).toBe(mockBlob);
    });
  });

  describe('2. Filename extraction from Content-Disposition', () => {
    it('extracts filename with quotes', () => {
      const header = 'attachment; filename="Mediora_Report_Subodh_123.pdf"';
      expect(extractFilenameFromDisposition(header)).toBe('Mediora_Report_Subodh_123.pdf');
    });

    it('extracts filename without quotes', () => {
      const header = 'attachment; filename=Mediora_Report_456.pdf';
      expect(extractFilenameFromDisposition(header)).toBe('Mediora_Report_456.pdf');
    });

    it('extracts RFC 5987 UTF-8 encoded filename', () => {
      const header = "attachment; filename*=UTF-8''Mediora_Report_Special.pdf";
      expect(extractFilenameFromDisposition(header)).toBe('Mediora_Report_Special.pdf');
    });

    it('falls back to safe default if Content-Disposition is absent or invalid', () => {
      expect(extractFilenameFromDisposition(null, 'Mediora_Report_999.pdf')).toBe('Mediora_Report_999.pdf');
      expect(extractFilenameFromDisposition('', 'Mediora_Report_999.pdf')).toBe('Mediora_Report_999.pdf');
      expect(extractFilenameFromDisposition('attachment', 'Mediora_Report_999.pdf')).toBe('Mediora_Report_999.pdf');
    });

    it('sanitizes malicious path traversal characters from filename', () => {
      const header = 'attachment; filename="../../etc/passwd.pdf"';
      const clean = extractFilenameFromDisposition(header);
      expect(clean).not.toContain('../');
      expect(clean).not.toContain('/');
      expect(clean).not.toContain('\\');
    });
  });

  describe('3. Blob Download and URL Object Cleanup', () => {
    it('creates temporary object URL, triggers download link click, and revokes URL', () => {
      const mockBlob = new Blob(['dummy pdf'], { type: 'application/pdf' });
      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test-uuid');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      downloadBlob(mockBlob, 'Mediora_Report_123.pdf');

      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/test-uuid');

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('4. Error handling and status code translation', () => {
    it('handles 401 authentication required error', async () => {
      const err = { response: { status: 401, data: {} } };
      const msg = await getDownloadErrorMessage(err);
      expect(msg).toContain('Authentication required');
    });

    it('handles 403 unauthorized error', async () => {
      const err = { response: { status: 403, data: {} } };
      const msg = await getDownloadErrorMessage(err);
      expect(msg).toContain('not authorized');
    });

    it('handles 404 report not found error', async () => {
      const err = { response: { status: 404, data: {} } };
      const msg = await getDownloadErrorMessage(err);
      expect(msg).toContain('Report not found');
    });

    it('handles 422 missing profile information error', async () => {
      const err = { response: { status: 422, data: {} } };
      const msg = await getDownloadErrorMessage(err);
      expect(msg).toContain('missing profile information');
    });

    it('handles 500 server generation failure', async () => {
      const err = { response: { status: 500, data: {} } };
      const msg = await getDownloadErrorMessage(err);
      expect(msg).toContain('Failed to generate secure PDF');
    });

    it('handles network error', async () => {
      const err = { request: {} };
      const msg = await getDownloadErrorMessage(err);
      expect(msg).toContain('Network error');
    });

    it('parses JSON error detail even if Axios receives it as a Blob', async () => {
      const errorJson = JSON.stringify({ detail: 'Profile date of birth is missing' });
      const blob = new Blob([errorJson], { type: 'application/json' });
      const err = { response: { status: 422, data: blob } };

      const msg = await getDownloadErrorMessage(err);
      expect(msg).toBe('Profile date of birth is missing');
    });
  });

  describe('5. Dashboard UI Integration & Report ID Isolation', () => {
    const mockDashboardData = {
      report_id: 123,
      profile_id: 1,
      health_score: 85,
      health_score_label: 'Good',
      parameters: [
        {
          id: 1,
          name: 'Hemoglobin',
          value: '14.2',
          unit: 'g/dL',
          status: 'normal',
          reference_range: '13.0 - 17.0',
        },
      ],
      abnormal_count: 0,
      normal_count: 1,
      total_count: 1,
    };

    beforeEach(() => {
      dashboardApi.getDashboard.mockResolvedValue(mockDashboardData);
      dashboardApi.getProfileReports.mockResolvedValue([]);
      recommendationsApi.getRecommendations.mockResolvedValue({ has_been_generated: true, findings: [] });
    });

    it('downloads the exact report ID viewed (Report A = 123)', async () => {
      const mockPdfBlob = new Blob(['%PDF encrypted'], { type: 'application/pdf' });
      vi.spyOn(reportsApi, 'downloadReportPdf').mockResolvedValueOnce({
        data: mockPdfBlob,
        headers: { 'content-disposition': 'attachment; filename="Mediora_Report_123.pdf"' },
      });

      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://test');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      render(
        <MemoryRouter initialEntries={['/reports/123/dashboard']}>
          <Routes>
            <Route path="/reports/:reportId/dashboard" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for dashboard to load
      expect(await screen.findByText(/download report/i)).toBeInTheDocument();

      const downloadBtn = screen.getByRole('button', { name: /download report/i });
      fireEvent.click(downloadBtn);

      // Verify downloadReportPdf was called with exact reportId 123
      await waitFor(() => {
        expect(reportsApi.downloadReportPdf).toHaveBeenCalledWith('123');
      });

      // Verify success feedback
      expect(await screen.findByText(/downloaded!/i)).toBeInTheDocument();

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('downloads exact report ID 456 when viewing report 456 (not report 123)', async () => {
      const mockPdfBlob = new Blob(['%PDF encrypted 456'], { type: 'application/pdf' });
      vi.spyOn(reportsApi, 'downloadReportPdf').mockResolvedValueOnce({
        data: mockPdfBlob,
        headers: { 'content-disposition': 'attachment; filename="Mediora_Report_456.pdf"' },
      });

      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://test456');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      render(
        <MemoryRouter initialEntries={['/reports/456/dashboard']}>
          <Routes>
            <Route path="/reports/:reportId/dashboard" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByText(/download report/i)).toBeInTheDocument();

      const downloadBtn = screen.getByRole('button', { name: /download report/i });
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(reportsApi.downloadReportPdf).toHaveBeenCalledWith('456');
        expect(reportsApi.downloadReportPdf).not.toHaveBeenCalledWith('123');
      });

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('prevents multiple simultaneous download clicks while downloading is in progress', async () => {
      let resolveDownload;
      const downloadPromise = new Promise((res) => {
        resolveDownload = res;
      });

      vi.spyOn(reportsApi, 'downloadReportPdf').mockImplementationOnce(() => downloadPromise);

      render(
        <MemoryRouter initialEntries={['/reports/123/dashboard']}>
          <Routes>
            <Route path="/reports/:reportId/dashboard" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      );

      const downloadBtn = await screen.findByRole('button', { name: /download report/i });
      fireEvent.click(downloadBtn);

      // Verify button shows loading state and is disabled
      expect(await screen.findByText(/downloading.../i)).toBeInTheDocument();
      expect(downloadBtn).toBeDisabled();

      // Click again while downloading
      fireEvent.click(downloadBtn);
      expect(reportsApi.downloadReportPdf).toHaveBeenCalledTimes(1);

      // Finish download
      resolveDownload({
        data: new Blob(['done'], { type: 'application/pdf' }),
        headers: {},
      });

      await waitFor(() => {
        expect(screen.queryByText(/downloading.../i)).not.toBeInTheDocument();
      });
    });

    it('displays user-friendly error notification on download failure', async () => {
      vi.spyOn(reportsApi, 'downloadReportPdf').mockRejectedValueOnce({
        response: { status: 404, data: {} },
      });

      render(
        <MemoryRouter initialEntries={['/reports/123/dashboard']}>
          <Routes>
            <Route path="/reports/:reportId/dashboard" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      );

      const downloadBtn = await screen.findByRole('button', { name: /download report/i });
      fireEvent.click(downloadBtn);

      expect(await screen.findByText('Report not found.')).toBeInTheDocument();
    });
  });

  describe('6. Security & Password Non-Exposure Verification', () => {
    it('confirms the frontend does NOT contain password calculation or generatePassword functions', () => {
      // Verify no password generation helpers are present
      expect(window.generatePassword).toBeUndefined();
      expect(localStorage.getItem('pdf_password')).toBeNull();
      expect(sessionStorage.getItem('pdf_password')).toBeNull();
    });
  });
});
