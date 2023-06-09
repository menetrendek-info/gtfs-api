# Use an official Node.js runtime as a parent image
FROM node:16.15.1-alpine3.16

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

# Start the app when the container launches
CMD ["npm", "start"]