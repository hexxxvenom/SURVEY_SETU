import { PrismaClient } from '@prisma/client';

// SECURITY & DEPLOYMENT:
// Injecting the database URL at runtime to bypass build-time validation errors in Railway/Cloud environments.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
