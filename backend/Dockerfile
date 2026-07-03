# Use Node.js 18 (Railway standard)
FROM node:18-alpine

# Install openssl for Prisma (required for alpine)
RUN apk add --no-available --update openssl

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
# Use a dummy URL during build to satisfy Prisma's validation
# The real URL will be injected by Railway at runtime
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build TypeScript
RUN npm run build

# Create uploads directory and set permissions
RUN mkdir -p uploads && chmod 777 uploads

# Expose port
EXPOSE 3000

# Start command
# We run migrations before starting
CMD npx prisma migrate deploy && npm start
