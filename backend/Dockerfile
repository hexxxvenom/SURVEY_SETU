FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install ALL dependencies
RUN npm install

# Copy source code
COPY . .

# Set dummy ENV for Prisma generation
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Set production permissions
RUN mkdir -p uploads && chmod 777 uploads

# RAILWAY NETWORK ALIGNMENT:
# We explicitly set port 8080 to match your Railway environment settings
ENV PORT=8080
EXPOSE 8080

# RUNTIME: Run migrations and start the server on port 8080
ENTRYPOINT ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
