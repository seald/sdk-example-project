FROM node:20

WORKDIR /backend/

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
RUN npm ci
COPY . ./

VOLUME ["/backend/sqlite/", "/backend/storage/"]

EXPOSE 4000

CMD node index.js
