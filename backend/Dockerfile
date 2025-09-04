# Use the required Node.js v18 for the backend
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Add Doppler CLI for secret management, which is needed for 'doppler run --'


# Copy package files first to leverage Docker's build cache
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of the backend application code
COPY . .

# Expose the port the backend runs on
EXPOSE 5000

# Define the default command to start the server.
# This will be used by docker-compose.
CMD ["npm", "run", "server"]

