import { defineConfig } from 'prisma';

export default defineConfig({
  migrations: {
    seed: 'node dist/prisma/seed.js',
  },
});
