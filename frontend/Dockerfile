FROM node:14
RUN npm i -g npm@7 #Fix a random lint bug https://github.com/bahmutov/npm-install/issues/103

WORKDIR /frontend/

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
RUN npm ci
COPY . ./
RUN npm run build

FROM nginx:latest
COPY --from=0 /frontend/build/ /usr/share/nginx/html/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
VOLUME ["/backend/sqlite/"]
EXPOSE 80
