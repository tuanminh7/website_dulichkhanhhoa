# REACTJS
FROM node:22-alpine AS build-stage
WORKDIR /webapp
COPY . .
RUN npm install
RUN npm run build


# NGNIX
FROM nginx:stable-alpine
ARG NGINX_CONF=nginx.local.conf
COPY --from=build-stage /webapp/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
