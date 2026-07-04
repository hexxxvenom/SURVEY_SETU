import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('--- PROFESSIONAL MASTER SEED START ---');

  // 1. CLEAN SLATE
  await prisma.answer.deleteMany();
  await prisma.response.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.loginSession.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.survey.deleteMany();

  // 2. CREATE MASTER USERS
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const superadmin = await prisma.user.create({
    data: {
      id: 'master-admin-id',
      username: 'superadmin',
      password_hash: hashedPassword,
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });

  const surveyor = await prisma.user.create({
    data: {
      id: 'master-surveyor-id',
      username: 'surveyor01',
      password_hash: hashedPassword,
      name: 'Field Surveyor 01',
      role: 'SURVEYOR',
      status: 'ACTIVE'
    }
  });

  // 3. REGISTER HARDWARE
  await prisma.device.create({
    data: {
      id: 'master-device-id',
      device_identifier: 'DEV-DEMO-001',
      assigned_user_id: surveyor.id,
      status: 'ACTIVE'
    }
  });

  // 4. SEED SAMPLE SURVEY
  const survey = await prisma.survey.create({
    data: {
      id: 'master-survey-id',
      title: 'National Demographic Survey 2026',
      version: 1,
      status: 'PUBLISHED',
      language: 'en',
      created_by: superadmin.id,
      questions: {
        create: [
          {
            question_text: 'What is your primary source of energy?',
            order_index: 1,
            option_count: 3,
            is_mandatory: true,
            options: {
              create: [
                { option_text: 'Solar', order_index: 1 },
                { option_text: 'Electric Grid', order_index: 2 },
                { option_text: 'Other', order_index: 3 }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('SEEDING ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
