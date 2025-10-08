FROM node:18 AS frontend-build
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend/. .
RUN npm run build

FROM nginx:stable-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY ./backend/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html