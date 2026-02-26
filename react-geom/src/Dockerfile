# Base image
FROM node:18.20.2 as build

# working directory
WORKDIR /app

# Copy project package.json
COPY package*.json ./

# Install deps
RUN npm install

# Copy the rest of the app
COPY . .

# Build the project for production
RUN npm run build

# Nginx image
FROM nginx:stable-alpine

# Copy build to web dir
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
