import axios from "axios";
import keycloak from "./keycloak";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost";

const api = axios.create({
  baseURL: `${baseURL}/api`,
});

api.interceptors.request.use(
  (config) => {
    if (keycloak.authenticated && keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api };