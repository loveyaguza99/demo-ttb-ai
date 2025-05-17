# Step 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

COPY . .

# Expose port
EXPOSE 3001

# Run the app
CMD ["npm", "start"]
