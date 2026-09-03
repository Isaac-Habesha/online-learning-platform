import api from './api';

export const authService = {
  // POST /api/accounts/register/
  register: async (userData) => {
    const response = await api.post('/accounts/register/', userData);
    return response.data;
  },

  // POST /api/accounts/login/
  login: async (credentials) => {
    const response = await api.post('/accounts/login/', credentials);
    return response.data;
  },

  // POST /api/accounts/logout/
  logout: async (refreshToken) => {
    const response = await api.post('/accounts/logout/', { refresh: refreshToken });
    return response.data;
  },

  // GET /api/accounts/me/
  getCurrentUser: async () => {
    const response = await api.get('/accounts/me/');
    return response.data;
  },

  // GET /api/accounts/profile/
  getProfile: async () => {
    const response = await api.get('/accounts/profile/');
    return response.data;
  },

  // PATCH /api/accounts/profile/
  updateProfile: async (profileData) => {
    const response = await api.patch('/accounts/profile/', profileData);
    return response.data;
  },

  // POST /api/accounts/verify-email/
  verifyEmail: async (token) => {
    const response = await api.post('/accounts/verify-email/', { token });
    return response.data;
  },

  // POST /api/accounts/resend-verification/
  resendVerification: async (email) => {
    const response = await api.post('/accounts/resend-verification/', { email });
    return response.data;
  },

  // POST /api/accounts/forgot-password/
  forgotPassword: async (email) => {
    const response = await api.post('/accounts/forgot-password/', { email });
    return response.data;
  },

  // POST /api/accounts/reset-password/
  resetPassword: async ({ token, password, password_confirm }) => {
    const response = await api.post('/accounts/reset-password/', {
      token,
      password,
      password_confirm,
    });
    return response.data;
  },

  // POST /api/accounts/google/
  googleLogin: async (credential, role = null) => {
    const payload = { credential };
    if (role) payload.role = role;
    const response = await api.post('/accounts/google/', payload);
    return response.data;
  },
};

export default authService;
