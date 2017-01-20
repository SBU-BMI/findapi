FROM node:latest

RUN apt-get update

RUN git clone https://github.com/SBU-BMI/findapi.git

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
RUN cp /findapi/package.json /usr/src/app/
RUN cp /findapi/findApi.js /usr/src/app/
RUN npm install

EXPOSE 3000
CMD [ "npm", "start" ]
