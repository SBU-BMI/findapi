FROM node:boron

RUN apt-get update

RUN git clone https://github.com/SBU-BMI/findapi.git

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
RUN cp /findapi/* /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 3000
CMD [ "npm", "start" ]
