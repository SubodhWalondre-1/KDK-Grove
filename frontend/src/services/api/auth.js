import apiClient from './client';

export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email.trim());
  formData.append('password', password);

  const response = await apiClient.post('/api/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

export const signupUser = async (name, email, password) => {
  const response = await apiClient.post('/api/auth/signup', {
    name: name.trim(),
    email: email.trim(),
    password,
  });
  return response.data;
};

export const authApi = {
  loginUser,
  signupUser,
};

export default authApi;
