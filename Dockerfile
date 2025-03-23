FROM node:latest

RUN apt-get update && apt-get upgrade -y

COPY . .

RUN npm install && npm run build

ENTRYPOINT ["npm", "start"]
