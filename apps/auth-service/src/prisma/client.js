import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import env from '../config/env.js';

const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
