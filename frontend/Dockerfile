<<<<<<< HEAD
# REACTJS
FROM node:22-alpine as build-stage
WORKDIR /webapp
COPY . .
RUN npm install
RUN npm run build


# NGNIX
FROM nginx:stable-alpine
COPY --from=build-stage /webapp/dist /usr/share/nginx/html
# COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
=======
# simple development container for the frontend
# upgrade to Node 20 series so Vite compatibility
FROM node:20-alpine

WORKDIR /app

# copy manifest and install inside image to avoid rebuild when source changes
COPY package.json package-lock.json ./
RUN npm ci

# copy rest of source
COPY . ./

# make sure node_modules isn't overwritten by host volume
VOLUME ["/app/node_modules"]

EXPOSE 5173

# run vite dev server binding to 0.0.0.0 so it is reachable from host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
>>>>>>> Tuan
