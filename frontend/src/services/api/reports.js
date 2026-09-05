import apiClient from './client';

export const uploadReport = async (profileId, file) => {
  const formData = new FormData();
  formData.append('profile_id', profileId);
  formData.append('file', file);

  const response = await apiClient.post('/api/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getReportStatus = async (reportId) => {
  const response = await apiClient.get(`/api/reports/${reportId}/status`);
  return response.data;
};

export const getReportDetail = async (reportId) => {
  const response = await apiClient.get(`/api/reports/${reportId}`);
  return response.data;
};

export const correctReportValues = async (reportId, corrections) => {
  const response = await apiClient.put(`/api/reports/${reportId}/correct`, {
    test_values: corrections,
  });
  return response.data;
};

export const reprocessReport = async (reportId) => {
  const response = await apiClient.post(`/api/reports/${reportId}/reprocess`);
  return response.data;
};

export const getReferenceRanges = async () => {
  const response = await apiClient.get('/api/reference-ranges');
  return response.data;
};

export const reportsApi = {
  uploadReport,
  getReportStatus,
  getReportDetail,
  correctReportValues,
  reprocessReport,
  getReferenceRanges,
};

export default reportsApi;
