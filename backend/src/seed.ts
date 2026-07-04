import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database...');
  await prisma.answer.deleteMany();
  await prisma.response.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.loginSession.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding fresh data...');
  
  const superadmin = await prisma.user.create({
    data: {
      username: 'superadmin',
      password_hash: bcrypt.hashSync('admin123', 10),
      name: 'Super Administrator',
      role: 'SUPER_ADMIN'
    }
  });

  const surveyor = await prisma.user.create({
    data: {
      username: 'surveyor01',
      password_hash: bcrypt.hashSync('admin123', 10),
      name: 'Surveyor One',
      role: 'SURVEYOR'
    }
  });

  await prisma.device.create({
    data: {
      device_identifier: 'DEV-DEMO-001',
      assigned_user_id: surveyor.id,
      printer_default_size: '58mm'
    }
  });

  console.log('Database seeded with superadmin and surveyor01.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
