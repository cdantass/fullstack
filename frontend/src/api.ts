import axios from 'axios';
import keycloak from './keycloak';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

});

api.interceptors.request.use(async (config) => {
  try {
    if (keycloak.authenticated) {
      await keycloak.updateToken(10);
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
  } catch (error) {
    console.error('Erro ao atualizar token Keycloak:', error);
  }
  return config;
});

export default api;
