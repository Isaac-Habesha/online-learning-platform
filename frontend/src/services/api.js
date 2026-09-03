import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

// Variables to handle simultaneous 401 refresh requests without race conditions
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper to check if URL is a public authentication endpoint
const isPublicAuthUrl = (url) => {
  if (!url) return false;
  return (
    url.includes('/accounts/register/') ||
    url.includes('/accounts/login/') ||
    url.includes('/accounts/verify-email/') ||
    url.includes('/accounts/resend-verification/') ||
    url.includes('/accounts/password-reset/') ||
    url.includes('/accounts/google/')
  );
};

// Request Interceptor: Attach Bearer token (except on public auth endpoints)
api.interceptors.request.use(
  (config) => {
    if (!isPublicAuthUrl(config.url)) {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Silent Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if auth calls fail with 401
    if (
      originalRequest.url?.includes('/accounts/token/refresh/') ||
      originalRequest.url?.includes('/accounts/login/') ||
      originalRequest.url?.includes('/accounts/register/')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        // Clear auth and trigger logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        if (refresh) {
          localStorage.setItem('refresh_token', refresh);
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;

        processQueue(null, access);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
