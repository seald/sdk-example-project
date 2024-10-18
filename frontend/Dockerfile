FROM node:20

WORKDIR /frontend/

COPY package.json ./package.json
# COPY package-lock.json ./package-lock.json
RUN npm i
COPY . ./
RUN npm run build

FROM nginx:latest
COPY --from=0 /frontend/dist/ /usr/share/nginx/html/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
VOLUME ["/backend/sqlite/"]
EXPOSE 80
