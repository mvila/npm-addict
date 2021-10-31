FROM node:12-slim

RUN apt-get update && apt-get install -y nano

ENV NODE_ENV=production

WORKDIR /app
COPY ./package.json .
RUN npm install --production --no-color --no-progress
COPY . .
RUN npm run build

ENTRYPOINT ["npm", "start"]
