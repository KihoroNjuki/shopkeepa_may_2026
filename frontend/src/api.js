import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;
// 

const api = axios.create({
  baseURL: BASE_URL,
  // headers: {
  //   'ngrok-skip-browser-warning': 'true',
  // },
});

// Attach access token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh access token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh');

      if (refresh) {
        try {
          const { data } = await axios.post(
            `http://${BASE_URL}/auth/refresh/`,
            { refresh }
          );
          localStorage.setItem('access', data.access);
          localStorage.setItem('refresh', data.refresh);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          // Refresh failed — clear tokens and force login
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data)       => api.post('/auth/register/', data),
  login:    (data)       => api.post('/auth/login/', data),
  logout:   (refresh)    => api.post('/auth/logout/', { refresh }),
  me:       ()           => api.get('/auth/me/'),
  updateMe:       (data)    => api.patch('/auth/me/', data),
  changePassword: (data)    => api.post('/auth/change-password/', data),
};

export default api;