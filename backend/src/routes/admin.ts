import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

const router = Router();

// Only Super Admin and Admin can access
router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

// --- User Management ---

router.get('/users', async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true, status: true, linked_device_id: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Explicitly handle User Creation
router.post('/users', async (req: AuthRequest, res) => {
  const { name, username, password, role } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password_hash: await bcrypt.hash(password, 10),
        role
      }
    });
    res.status(201).json(user);
  } catch (error: any) {
    console.error("User creation failed:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:id/status', async (req: AuthRequest, res) => {
  const { status } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Device Management ---

router.get('/devices', async (req: AuthRequest, res) => {
  try {
    const devices = await prisma.device.findMany({
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: devices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Explicitly handle Device Registration
router.post('/devices', async (req: AuthRequest, res) => {
  const { device_identifier } = req.body;
  if (!device_identifier) {
    return res.status(400).json({ error: 'Device Identifier is required' });
  }

  try {
    const existing = await prisma.device.findUnique({ where: { device_identifier } });
    if (existing) return res.status(409).json({ error: 'Device already registered' });

    const device = await prisma.device.create({
      data: { device_identifier }
    });
    res.status(201).json(device);
  } catch (error: any) {
    console.error("Device registration failed:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/devices/:id/status', async (req: AuthRequest, res) => {
  const { status } = req.body;
  try {
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(device);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Response Management ---

router.get('/responses', async (req: AuthRequest, res) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
