import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

// --- User Management ---

router.get('/users', async (req: AuthRequest, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true, status: true, linked_device_id: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ data: users });
});

router.post('/users', async (req: AuthRequest, res) => {
  const { name, username, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(409).json({ error: 'Username already taken' });

  const user = await prisma.user.create({
    data: {
      name,
      username,
      password_hash: await require('bcryptjs').hash(password, 10),
      role
    }
  });
  res.status(201).json(user);
});

router.patch('/users/:id/status', async (req: AuthRequest, res) => {
  const { status } = req.body; // 'ACTIVE' or 'LOCKED'
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status }
  });

  await prisma.auditLog.create({
    data: {
      actor_user_id: req.user!.id,
      action_type: `USER_${status}`,
      target_entity: 'User',
      target_id: user.id
    }
  });

  res.json(user);
});

// --- Device Management ---

router.get('/devices', async (req: AuthRequest, res) => {
  const devices = await prisma.device.findMany({
    include: { user: { select: { name: true, username: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ data: devices });
});

router.post('/devices', async (req: AuthRequest, res) => {
  const { device_identifier } = req.body;
  const existing = await prisma.device.findUnique({ where: { device_identifier } });
  if (existing) return res.status(409).json({ error: 'Device already registered' });

  const device = await prisma.device.create({
    data: { device_identifier }
  });
  res.status(201).json(device);
});

router.patch('/devices/:id/status', async (req: AuthRequest, res) => {
  const { status } = req.body;
  const device = await prisma.device.update({
    where: { id: req.params.id },
    data: { status }
  });

  await prisma.auditLog.create({
    data: {
      actor_user_id: req.user!.id,
      action_type: `DEVICE_${status}`,
      target_entity: 'Device',
      target_id: device.id
    }
  });

  res.json(device);
});

// --- Response Management ---

router.get('/responses', async (req: AuthRequest, res) => {
  const responses = await prisma.response.findMany({
    include: {
      surveyor: { select: { name: true, username: true } },
      device: { select: { device_identifier: true } },
      survey: { select: { title: true } },
      answers: { include: { question: true, selectedOption: true } }
    },
    orderBy: { submitted_at: 'desc' }
  });
  res.json({ data: responses });
});

export default router;
