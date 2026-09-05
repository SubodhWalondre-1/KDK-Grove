import apiClient from './client';

export const getNutritionContext = async (profileId) => {
  const response = await apiClient.get(`/api/profiles/${profileId}/nutrition-context`);
  return response.data;
};

export const updateNutritionContext = async (profileId, contextData) => {
  const response = await apiClient.post(`/api/profiles/${profileId}/nutrition-context`, contextData);
  return response.data;
};

export const getDietPlan = async (reportId) => {
  const response = await apiClient.get(`/api/reports/${reportId}/diet-plan`);
  return response.data;
};

export const generateDietPlan = async (reportId, contextOverride = null, forceRegenerate = false) => {
  const response = await apiClient.post(
    `/api/reports/${reportId}/diet-plan/generate?force_regenerate=${forceRegenerate}`,
    contextOverride
  );
  return response.data;
};

export const dietApi = {
  getNutritionContext,
  updateNutritionContext,
  getDietPlan,
  generateDietPlan,
};

export default dietApi;
