import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Flag and queue to manage concurrent 401s during token refresh
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

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 and auto-refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints to avoid loops
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login/') ||
      originalRequest?.url?.includes('/auth/register/') ||
      originalRequest?.url?.includes('/auth/refresh/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (typeof window === 'undefined') {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token available, purge auth state
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Token refresh already in flight, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Modular API Service Helpers
export const authAPI = {
  register: (payload) => apiClient.post('/auth/register/', payload),
  login: (payload) => apiClient.post('/auth/login/', payload),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh/', { refresh: refreshToken }),
  getMe: () => apiClient.get('/auth/me/'),
};

export const postsAPI = {
  getPosts: (params = {}) => apiClient.get('/posts/', { params }),
  getPostBySlug: (slug) => apiClient.get(`/posts/${slug}/`),
  createPost: (data) => apiClient.post('/posts/', data),
  updatePost: (slug, data) => apiClient.patch(`/posts/${slug}/`, data),
  deletePost: (slug) => apiClient.delete(`/posts/${slug}/`),
  publishPost: (slug) => apiClient.post(`/posts/${slug}/publish/`),
  unpublishPost: (slug) => apiClient.post(`/posts/${slug}/unpublish/`),
  getMyPosts: (params = {}) => apiClient.get('/me/posts/', { params }),
};

export const categoriesAPI = {
  getCategories: () => apiClient.get('/categories/'),
  createCategory: (data) => apiClient.post('/categories/', data),
  updateCategory: (id, data) => apiClient.patch(`/categories/${id}/`, data),
  deleteCategory: (id) => apiClient.delete(`/categories/${id}/`),
};

export const commentsAPI = {
  getPostComments: (slug) => apiClient.get(`/posts/${slug}/comments/`),
  addComment: (slug, data) => apiClient.post(`/posts/${slug}/comments/`, data),
  updateComment: (id, data) => apiClient.patch(`/comments/${id}/`, data),
  deleteComment: (id) => apiClient.delete(`/comments/${id}/`),
};

export const adminAPI = {
  getUsers: () => apiClient.get('/admin/users/'),
  updateUser: (id, data) => apiClient.patch(`/admin/users/${id}/`, data),
};

export default apiClient;
