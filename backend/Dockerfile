FROM node:18-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

COPY package*.json ./
# Install ALL dependencies including devDeps for build
RUN npm install

COPY . .

# Generate Prisma client with a DUMMY env to satisfy build-time validation
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build TypeScript
RUN npm run build
# Explicitly compile the seed file to ensure it exists in dist/
RUN npx tsc src/seed.ts --outDir dist --esModuleInterop --skipLibCheck --target es2022

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 3000

# RUNTIME ONLY: Run migrations and start
# This ensures DATABASE_URL is only accessed when Railway provides it at runtime
ENTRYPOINT ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
