import axios from "axios";
import { ACCESS_TOKEN } from "@/constants";

console.log(">>>> Módulo api.ts foi carregado (versão de debug)");

const baseURL = import.meta.env.VITE_API_URL || "http://localhost";

const api = axios.create({
  baseURL: `${baseURL}/api`,
});

api.interceptors.request.use(
  (config) => {
    console.log(">>>> Interceptor do Axios ativado para:", config.url);
    const token = localStorage.getItem(ACCESS_TOKEN);

    if (token) {
      console.log(">>>> Token encontrado:", token.substring(0, 15) + "...");
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(">>>> AVISO: Nenhum token encontrado com a chave:", ACCESS_TOKEN);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api };