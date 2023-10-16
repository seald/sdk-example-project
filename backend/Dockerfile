FROM node:14
RUN npm i -g npm@7 #Fix a random lint bug https://github.com/bahmutov/npm-install/issues/103

WORKDIR /backend/

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
RUN npm ci
COPY . ./

VOLUME ["/backend/sqlite/", "/backend/storage/"]

EXPOSE 4000

CMD node index.js
