import axios from 'axios';
import apiClient, { API_URL } from './client';

// Plain unauthenticated client for guest access
const publicClient = axios.create({
  baseURL: API_URL,
});

// --- OWNER-AUTHENTICATED API CALLS ---

export const createShareLink = async (reportId, expiresInDays = 7) => {
  const response = await apiClient.post(`/api/reports/${reportId}/share`, {
    expires_in_days: expiresInDays,
  });
  return response.data;
};

export const getShareLinks = async (profileId) => {
  const response = await apiClient.get(`/api/profiles/${profileId}/share-links`);
  return response.data;
};

export const getShareLinkLogs = async (shareLinkId) => {
  const response = await apiClient.get(`/api/share-links/${shareLinkId}/logs`);
  return response.data;
};

export const revokeShareLink = async (shareLinkId) => {
  const response = await apiClient.post(`/api/share-links/${shareLinkId}/revoke`);
  return response.data;
};

// --- PUBLIC UNAUTHENTICATED GUEST API CALLS ---

export const getSharedPreview = async (token) => {
  const response = await publicClient.get(`/api/shared/${token}`);
  return response.data;
};

export const recordSharedAccess = async (token, viewerName = null) => {
  const response = await publicClient.post(`/api/shared/${token}/access`, {
    viewer_name: viewerName,
  });
  return response.data;
};

export const sharingApi = {
  createShareLink,
  getShareLinks,
  getShareLinkLogs,
  revokeShareLink,
  getSharedPreview,
  recordSharedAccess,
};

export default sharingApi;
