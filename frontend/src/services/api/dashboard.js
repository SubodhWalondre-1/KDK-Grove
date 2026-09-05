import apiClient from './client';

export const getDashboard = async (reportId) => {
  const response = await apiClient.get(`/api/reports/${reportId}/dashboard`);
  return response.data;
};

export const getProfileHealthScore = async (profileId) => {
  const response = await apiClient.get(`/api/profiles/${profileId}/health-score`);
  return response.data;
};

export const getProfileReports = async (profileId) => {
  try {
    const response = await apiClient.get(`/api/profiles/${profileId}/reports`);
    return response.data;
  } catch {
    return [];
  }
};

export const dashboardApi = {
  getDashboard,
  getProfileHealthScore,
  getProfileReports,
};

export default dashboardApi;
