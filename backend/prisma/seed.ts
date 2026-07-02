import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');
  
  // Create Super Admin
  const admin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: { password_hash: bcrypt.hashSync('admin123', 10) },
    create: {
      username: 'superadmin',
      password_hash: bcrypt.hashSync('admin123', 10),
      name: 'System Administrator',
      role: 'SUPER_ADMIN'
    }
  });

  // Create Surveyor
  const surveyor = await prisma.user.upsert({
    where: { username: 'surveyor01' },
    update: { password_hash: bcrypt.hashSync('admin123', 10) },
    create: {
      username: 'surveyor01',
      password_hash: bcrypt.hashSync('admin123', 10),
      name: 'Rahul Sharma',
      role: 'SURVEYOR'
    }
  });

  // Create Device
  const device = await prisma.device.upsert({
    where: { device_identifier: 'DEV-DEMO-001' },
    update: {},
    create: {
      device_identifier: 'DEV-DEMO-001',
      assigned_user_id: surveyor.id,
      printer_default_size: '58mm'
    }
  });

  // Create 18-Question Survey
  const survey = await prisma.survey.create({
    data: {
      title: 'National Demographic & Health Survey 2026',
      version: 1,
      status: 'PUBLISHED',
      language: 'en',
      created_by: admin.id,
      questions: {
        create: [
          { question_text: 'What is your age group?', order_index: 1, option_count: 4, is_mandatory: true, options: { create: [
            { option_text: '18-25', order_index: 1 }, { option_text: '26-35', order_index: 2 }, { option_text: '36-50', order_index: 3 }, { option_text: '51+', order_index: 4 }
          ]}},
          { question_text: 'What is your primary occupation?', order_index: 2, option_count: 4, is_mandatory: true, options: { create: [
            { option_text: 'Agriculture', order_index: 1 }, { option_text: 'Business', order_index: 2 }, { option_text: 'Service/Salaried', order_index: 3 }, { option_text: 'Unemployed/Student', order_index: 4 }
          ]}},
          { question_text: 'Highest level of education completed?', order_index: 3, option_count: 4, is_mandatory: true, options: { create: [
            { option_text: 'Primary', order_index: 1 }, { option_text: 'Secondary', order_index: 2 }, { option_text: 'Graduate', order_index: 3 }, { option_text: 'Post-Graduate', order_index: 4 }
          ]}},
          { question_text: 'Do you have access to clean drinking water within 1km?', order_index: 4, option_count: 2, is_mandatory: true, options: { create: [
            { option_text: 'Yes', order_index: 1 }, { option_text: 'No', order_index: 2 }
          ]}},
          { question_text: 'Is there a primary health center in your village/ward?', order_index: 5, option_count: 2, is_mandatory: true, options: { create: [
            { option_text: 'Yes', order_index: 1 }, { option_text: 'No', order_index: 2 }
          ]}},
          { question_text: 'How often do you use the internet?', order_index: 6, option_count: 4, is_mandatory: true, options: { create: [
            { option_text: 'Daily', order_index: 1 }, { option_text: 'Weekly', order_index: 2 }, { option_text: 'Rarely', order_index: 3 }, { option_text: 'Never', order_index: 4 }
          ]}},
          { question_text: 'Do you own a smartphone?', order_index: 7, option_count: 2, is_mandatory: true, options: { create: [
            { option_text: 'Yes', order_index: 1 }, { option_text: 'No', order_index: 2 }
          ]}},
          { question_text: 'What is your primary mode of transportation?', order_index: 8, option_count: 4, is_mandatory: true, options: { create: [
            { option_text: 'Walking/Bicycle', order_index: 1 }, { option_text: 'Two-wheeler', order_index: 2 }, { option_text: 'Public Transport', order_index: 3 }, { option_text: 'Four-wheeler', order_index: 4 }
          ]}},
          { question_text: 'Have you availed any government health insurance schemes?', order_index: 9, option_count: 2, is_mandatory: true, options: { create: [
            { option_text: 'Yes', order_index: 1 }, { option_text: 'No', order_index: 2 }
          ]}},
          { question_text: 'Are you satisfied with local road conditions?', order_index: 10, option_count: 3, is_mandatory: false, options: { create: [
            { option_text: 'Satisfied', order_index: 1 }, { option_text: 'Neutral', order_index: 2 }, { option_text: 'Dissatisfied', order_index: 3 }
          ]}},
          { question_text: 'How frequent are power cuts in your area?', order_index: 11, option_count: 4, is_mandatory: true, options: { create: [
            { option_text: 'Rare (Almost 24/7)', order_index: 1 }, { option_text: 'Occasional (1-2 hrs)', order_index: 2 }, { option_text: 'Frequent (3-5 hrs)', order_index: 3 }, { option_text: 'Severe (5+ hrs)', order_index: 4 }
          ]}},
          { question_text: 'Is your house made of pucca (permanent) materials?', order_index: 12, option_count: 2, is_mandatory: true, options: { create: [
            { option_text: 'Yes', order_index: 1 }, { option_text: 'No (Kutcha/Semi)', order_index: 2 }
          ]}},
          { question_text: 'Do you have an LPG connection for cooking?', order_index: 13, option_count: 2, is_mandatory: true, options: { create: [
            { option_text: 'Yes', order_index: 1 }, { option_text: 'No', order_index: 2 }
          ]}},
          { question_text: 'Are children in your household attending school?', order_index: 14, option_count: 3, is_mandatory: true, options: { create: [
            { option_text: 'Yes, All', order_index: 1 }, { option_text: 'Some', order_index: 2 }, { option_text: 'None/Not Applicable', order_index: 3 }
          ]}},
          { question_text: 'What is the primary source of household income?', order_index: 15, option_count: 4, is_mandatory: true, options: { create: [
            { option_text: 'Farming', order_index: 1 }, { option_text: 'Daily Wage', order_index: 2 }, { option_text: 'Salary', order_index: 3 }, { option_text: 'Business', order_index: 4 }
          ]}},
          { question_text: 'Do you feel safe walking alone at night in your area?', order_index: 16, option_count: 2, is_mandatory: true, options: { create: [
            { option_text: 'Yes', order_index: 1 }, { option_text: 'No', order_index: 2 }
          ]}},
          { question_text: 'Have you received any agricultural subsidies this year?', order_index: 17, option_count: 3, is_mandatory: false, options: { create: [
            { option_text: 'Yes', order_index: 1 }, { option_text: 'No', order_index: 2 }, { option_text: 'Not Applicable', order_index: 3 }
          ]}},
          { question_text: 'Overall, how optimistic are you about the future of your local community?', order_index: 18, option_count: 3, is_mandatory: true, options: { create: [
            { option_text: 'Very Optimistic', order_index: 1 }, { option_text: 'Neutral', order_index: 2 }, { option_text: 'Pessimistic', order_index: 3 }
          ]}}
        ]
      }
    }
  });

  console.log('Seeding completed. 18-Question Survey ID:', survey.id);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
