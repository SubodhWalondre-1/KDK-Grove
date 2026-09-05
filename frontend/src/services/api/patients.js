import apiClient from './client';

export const getSpecies = async () => {
  const response = await apiClient.get('/api/species');
  return response.data;
};

export const getProfiles = async () => {
  const response = await apiClient.get('/api/profiles');
  return response.data;
};

export const createProfile = async (profileData) => {
  const response = await apiClient.post('/api/profiles', profileData);
  return response.data;
};

export const patientsApi = {
  getSpecies,
  getProfiles,
  createProfile,
};

export default patientsApi;
