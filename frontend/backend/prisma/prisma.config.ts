import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  adapter: {
    type: 'postgresql',
    url: process.env.DATABASE_URL, // pega do .env
  },
});
