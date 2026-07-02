import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'superadmin' } });
  console.log('User:', user);
  if (user) {
    const isValid = await bcrypt.compare('admin123', user.password_hash);
    console.log('Is valid?', isValid);
  }
}

main().finally(() => prisma.$disconnect());
