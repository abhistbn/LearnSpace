# Menggunakan Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY app.js ./
COPY public ./public
COPY src ./src

# Buat direktori uploads
RUN mkdir -p uploads

# Expose port (sesuaikan dengan port di app.js)
EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production

# Run application
CMD ["node", "app.js"]