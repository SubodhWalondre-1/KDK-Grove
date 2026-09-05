import apiClient from './client';

export const getRecommendations = async (reportId) => {
  const response = await apiClient.get(`/api/reports/${reportId}/recommendations`);
  return response.data;
};

export const generateRecommendations = async (reportId, forceRegenerate = false) => {
  const response = await apiClient.post(
    `/api/reports/${reportId}/recommendations/generate?force_regenerate=${forceRegenerate}`
  );
  return response.data;
};

export const recommendationsApi = {
  getRecommendations,
  generateRecommendations,
};

export default recommendationsApi;
