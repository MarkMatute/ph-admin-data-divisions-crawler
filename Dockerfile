FROM node:16.16.0-bullseye

WORKDIR /app

RUN apt-get update

RUN npm config set registry http://registry.npmjs.org

ADD package.json /app/package.json

ADD package-lock.json /app/package-lock.json

RUN npm install

ADD . /app

EXPOSE 3000 9229
