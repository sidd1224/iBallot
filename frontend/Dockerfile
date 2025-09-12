# Use a specific Node.js version for consistency
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies. This is done in a separate
# layer to take advantage of Docker's build cache.
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend application code
COPY . .

# Expose the port Vite will run on
EXPOSE 3000

# The command to run when the container starts.
# The --host flag is essential for accessing the server from your browser.
CMD ["npx", "vite", "--host"]

