import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SharingSettingsPage from '../../src/features/sharing/SharingSettingsPage';
import * as sharingApi from '../../src/api/sharingApi';
import { useProfileStore } from '../../src/store/profileStore';
import { useAuthStore } from '../../src/store/authStore';

vi.mock('../../src/api/sharingApi');

describe('SharingSettingsPage Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ token: 'test-token', user: { name: 'Rahul' } });
    useProfileStore.setState({
      activeProfile: { id: 1, profile_name: 'Rahul Kumar', species: 'human' },
    });
    sharingApi.getShareLinks.mockResolvedValue({ share_links: [] });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/profiles/1/sharing']}>
        <Routes>
          <Route path="/profiles/:profileId/sharing" element={<SharingSettingsPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders list of share link cards with active, expired, and revoked badges', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 7).toISOString();
    const pastDate = new Date(Date.now() - 86400000).toISOString();

    sharingApi.getShareLinks.mockResolvedValue({
      share_links: [
        {
          id: 101,
          token: 'token_active',
          report_id: 1,
          status: 'active',
          expires_at: futureDate,
          view_count: 3,
          created_at: new Date().toISOString(),
          unseen_count: 1,
          latest_access_at: new Date().toISOString(),
        },
        {
          id: 102,
          token: 'token_expired',
          report_id: 1,
          status: 'active', // Active in DB, but expired past date
          expires_at: pastDate,
          view_count: 0,
          created_at: pastDate,
          unseen_count: 0,
          latest_access_at: null,
        },
        {
          id: 103,
          token: 'token_revoked',
          report_id: 1,
          status: 'revoked',
          expires_at: futureDate,
          view_count: 5,
          created_at: new Date().toISOString(),
          unseen_count: 0,
          latest_access_at: null,
        },
      ],
    });

    renderComponent();

    const reportLabels = await screen.findAllByText('Report #1');
    expect(reportLabels.length).toBe(3);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Revoked')).toBeInTheDocument();

    expect(screen.getByText('3 views')).toBeInTheDocument();
    expect(screen.getByText('1 new view')).toBeInTheDocument();
  });

  it('shows "You haven\'t shared any reports yet" empty state when share_links is empty', async () => {
    sharingApi.getShareLinks.mockResolvedValue({ share_links: [] });

    renderComponent();

    expect(await screen.findByText(/you haven't shared any reports yet/i)).toBeInTheDocument();
  });

  it('clicking "View Access Log" opens modal and displays access logs', async () => {
    sharingApi.getShareLinks.mockResolvedValue({
      share_links: [
        {
          id: 101,
          token: 'token_active',
          report_id: 1,
          status: 'active',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          view_count: 2,
          created_at: new Date().toISOString(),
          unseen_count: 1,
          latest_access_at: new Date().toISOString(),
        },
      ],
    });

    sharingApi.getShareLinkLogs.mockResolvedValueOnce({
      logs: [
        {
          id: 1,
          accessed_at: new Date().toISOString(),
          device_type: 'mobile',
          viewer_name: 'Priya',
          seen: false,
        },
      ],
    });

    renderComponent();

    const viewLogsBtn = await screen.findByRole('button', { name: /view access log/i });
    fireEvent.click(viewLogsBtn);

    expect(await screen.findByText('Priya')).toBeInTheDocument();
    expect(screen.getByText('mobile')).toBeInTheDocument();
    expect(sharingApi.getShareLinkLogs).toHaveBeenCalledWith(101);
  });

  it('revoking a share link requires confirmation and updates link status to revoked', async () => {
    sharingApi.getShareLinks.mockResolvedValue({
      share_links: [
        {
          id: 101,
          token: 'token_active',
          report_id: 1,
          status: 'active',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          view_count: 0,
          created_at: new Date().toISOString(),
          unseen_count: 0,
          latest_access_at: null,
        },
      ],
    });

    sharingApi.revokeShareLink.mockResolvedValueOnce({
      id: 101,
      token: 'token_active',
      report_id: 1,
      status: 'revoked',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      view_count: 0,
      created_at: new Date().toISOString(),
    });

    renderComponent();

    const revokeBtn = await screen.findByRole('button', { name: /revoke/i });
    fireEvent.click(revokeBtn);

    // Confirmation modal appears
    expect(await screen.findByText(/revoke share link\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /yes, revoke link/i });
    fireEvent.click(confirmBtn);

    expect(sharingApi.revokeShareLink).toHaveBeenCalledWith(101);
    expect(await screen.findByText('Revoked')).toBeInTheDocument();
  });

  it('loading skeleton shows while the initial fetch is pending, then resolves to real content', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    sharingApi.getShareLinks.mockReturnValue(promise);

    renderComponent();

    expect(screen.getByText(/loading share links/i)).toBeInTheDocument();

    resolvePromise({
      share_links: [
        {
          id: 105,
          token: 'token_pending_test',
          report_id: 2,
          status: 'active',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          view_count: 0,
          created_at: new Date().toISOString(),
          unseen_count: 0,
          latest_access_at: null,
        },
      ],
    });

    expect(await screen.findByText('Report #2')).toBeInTheDocument();
    expect(screen.queryByText(/loading share links/i)).not.toBeInTheDocument();
  });
});
