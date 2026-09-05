import apiClient from './client';

export const getTrendOverview = async (profileId) => {
  const response = await apiClient.get(`/api/profiles/${profileId}/trends/overview`);
  return response.data;
};

export const getTrendList = async (profileId) => {
  const response = await apiClient.get(`/api/profiles/${profileId}/trends`);
  return response.data;
};

export const getTestTrend = async (profileId, testName) => {
  const response = await apiClient.get(
    `/api/profiles/${profileId}/trends/${encodeURIComponent(testName)}`
  );
  return response.data;
};

export const getTrendInsight = async (profileId, testName) => {
  const response = await apiClient.get(
    `/api/profiles/${profileId}/trends/${encodeURIComponent(testName)}/insight`
  );
  return response.data;
};

export const trendsApi = {
  getTrendOverview,
  getTrendList,
  getTestTrend,
  getTrendInsight,
};

export default trendsApi;
