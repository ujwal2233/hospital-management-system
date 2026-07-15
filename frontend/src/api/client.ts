import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryToken: string | null = null;
let activeTenantOverride: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

export const setActiveTenantHeader = (tenantId: string | null) => {
  activeTenantOverride = tenantId;
};

export const getActiveTenantHeader = () => activeTenantOverride;

// Request interceptor to inject Authorization header and x-tenant-id header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (activeTenantOverride && config.headers) {
      config.headers['x-tenant-id'] = activeTenantOverride;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auto-refresh of access tokens on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response.data, // Return data directly for easier usage
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // If 401 Unauthorized and we haven't retried yet
    const rawErrorData: any = error.response?.data;
    if (
      error.response?.status === 401 &&
      !(originalRequest as any)._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        const storedAuth = localStorage.getItem('hms.auth');
        if (!storedAuth) throw new Error('No refresh token available');
        const { refreshToken } = JSON.parse(storedAuth);

        // Call the refresh endpoint
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        if (res.data?.success && res.data.data?.accessToken) {
          const newAccessToken = res.data.data.accessToken;
          const newRefreshToken = res.data.data.refreshToken;
          
          setAccessToken(newAccessToken);

          // Update localStorage auth
          const parsed = JSON.parse(storedAuth);
          parsed.accessToken = newAccessToken;
          parsed.refreshToken = newRefreshToken;
          localStorage.setItem('hms.auth', JSON.stringify(parsed));

          processQueue(null, newAccessToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh token rejected');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        localStorage.removeItem('hms.auth');
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Wrap the error message correctly for standard error envelope
    const message = rawErrorData?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
