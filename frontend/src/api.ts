import axios from "axios";

/**
 * URL base da API.
 * Em ambiente de produção (Choreo), utiliza um caminho relativo.
 * Em desenvolvimento, pode ser sobreposto pela variável de ambiente VITE_API_URL.
 */
const apiUrl = "/choreo-apis/awbo/backend/rest-api-be2/v1.0";

/**
 * Instância centralizada do Axios para todas as chamadas de API do sistema.
 * Configurada com baseURL e suporte a credenciais (cookies).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
  withCredentials: true,
});

/**
 * Interceptor de requisições.
 * Este bloco é executado antes de cada chamada à API.
 * Ele recupera o token de acesso do localStorage e o adiciona ao cabeçalho de Autorização.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
