import axios from 'axios';
import keycloak from './keycloak';

const api = axios.create({
  baseURL: 'http://localhost/api',
});

api.interceptors.request.use(
  async (config) => {
    try {
      await keycloak.updateToken(5);

      if (keycloak.authenticated && keycloak.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      }
    } catch (error) {
      console.error('Erro ao atualizar o token do Keycloak:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
