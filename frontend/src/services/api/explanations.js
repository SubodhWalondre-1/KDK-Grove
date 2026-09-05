import apiClient from './client';

export const getExplanation = async (reportId, valueId) => {
  const response = await apiClient.get(`/api/reports/${reportId}/values/${valueId}/explanation`);
  return response.data;
};

export const explanationsApi = {
  getExplanation,
};

export default explanationsApi;
