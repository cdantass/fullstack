import axios from 'axios';
import keycloak from './keycloak';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Interceptor global — injeta o token se existir
api.interceptors.request.use(async (config) => {
  try {
    if (keycloak.authenticated) {
      // Atualiza token se estiver perto de expirar
      await keycloak.updateToken(10);
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
  } catch (error) {
    console.error('Erro ao atualizar token Keycloak:', error);
  }
  return config;
});

export default api;
