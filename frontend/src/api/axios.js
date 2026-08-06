import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ------------------------
// Request Interceptor
// ------------------------

API.interceptors.request.use(
  (config) => {

    // Don't attach token to public routes
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

    return config;

  },
  (error) => Promise.reject(error)
);


// ------------------------
// Response Interceptor
// ------------------------

API.interceptors.response.use(

  (response) => response,

  async (error) => {

    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {

      originalRequest._retry = true;

      try {

        const refreshToken =
          localStorage.getItem("refreshToken");

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

        originalRequest.headers.Authorization =
          `Bearer ${res.data.access}`;

        return API(originalRequest);

      } catch (refreshError) {

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        window.location.href = "/";

        return Promise.reject(refreshError);

      }

    }

    return Promise.reject(error);

  }

);

export default API;