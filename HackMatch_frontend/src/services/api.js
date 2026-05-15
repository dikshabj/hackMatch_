import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Add Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Expiry & Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Attempt to get new access token using refresh token in body
          const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken
          });

          const newToken = res.data.accessToken || res.data; // Handle string or object response
          if (newToken && typeof newToken === 'string') {
            localStorage.setItem('token', newToken);
            // UPDATE THE ORIGINAL REQUEST HEADER WITH THE NEW TOKEN
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest); // Retry the request
          }
        } catch (refreshError) {
          console.error("Refresh token expired or invalid", refreshError);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
