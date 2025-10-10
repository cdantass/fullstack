# Stage 1: Construir a aplicação React
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend/. .

# Argumentos passados pelo docker-compose.yml
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT

# Define as variáveis de ambiente para o processo de build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT=$VITE_KEYCLOAK_CLIENT

RUN npm run build

# Stage 2: Servir os ficheiros estáticos com Nginx
FROM nginx:stable-alpine
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]