# REACTJS
FROM node:18-alpine
WORKDIR /webapp
COPY . .
RUN npm install
RUN npm run build


# NGNIX
FROM nginx:stable-alpine
COPY --from=build-stage /app/build /usr/share/nginx/html
# Copy cấu hình nginx tùy chỉnh nếu cần
COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]