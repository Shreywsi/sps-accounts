import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach access token to protected requests
API.interceptors.request.use(
  (config) => {
    if (
      config.url?.includes("/auth/login/") ||
      config.url?.includes("/auth/signup/") ||
      config.url?.includes("/auth/refresh/")
    ) {
      return config;
    }

    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);
// Automatically refresh expired access tokens
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const isAuthRequest = ["/auth/login/", "/auth/signup/", "/auth/refresh/", "/auth/forgot-password/", "/auth/reset-password/"]
      .some((path) => originalRequest?.url?.includes(path));

    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await API.post(
          "/auth/refresh/",
          {
            refresh: refreshToken,
          }
        );

        localStorage.setItem(
          "accessToken",
          res.data.access
        );

        if (res.data.refresh) {
          localStorage.setItem(
            "refreshToken",
            res.data.refresh
          );
        }

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

        return API(originalRequest);
      } catch (refreshError) {
        console.log("Token refresh failed, logging out...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // Only redirect if not already on login page
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;