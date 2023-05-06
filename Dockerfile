# Use an official Node.js runtime as a parent image
FROM node:current-alpine3.17

# Expose the port that the app listens on
EXPOSE 8081

# Set the working directory to /app
WORKDIR /app

RUN apk add --no-cache python3 make g++ curl

# Copy package.json and package-lock.json to the container
COPY package.json ./
COPY yarn.lock ./

# Initialize the database
RUN mkdir data
RUN touch data/db.sqlite

# Install app dependencies
RUN yarn install

# Copy the rest of the application code to the container
COPY . .

HEALTHCHECK CMD curl -I --fail http://localhost:8081 || exit 1   

# Start the app when the container launches
CMD ["npm", "start"]