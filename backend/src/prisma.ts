import { PrismaClient } from '@prisma/client';

// Ensure the client uses the environment variable provided at runtime
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export default prisma;
