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

router.post('/users', async (req: AuthRequest, res) => {
  const { name, username, password, role, linked_device_id } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'All core fields are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password_hash: await bcrypt.hash(password, 10),
        role,
        linked_device_id: linked_device_id || null
      }
    });

    if (linked_device_id) {
        await prisma.device.update({
            where: { device_identifier: linked_device_id },
            data: { assigned_user_id: user.id }
        });
    }

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update User (Edit)
router.put('/users/:id', async (req: AuthRequest, res) => {
    const { name, role, linked_device_id, password } = req.body;
    try {
        const updateData: any = { name, role, linked_device_id: linked_device_id || null };
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete User
router.delete('/users/:id', async (req: AuthRequest, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error: any) {
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
    res.status(500).json({ error: error.message });
  }
});

// Update Device (Edit)
router.put('/devices/:id', async (req: AuthRequest, res) => {
    const { device_identifier } = req.body;
    try {
        const device = await prisma.device.update({
            where: { id: req.params.id },
            data: { device_identifier }
        });
        res.json(device);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Device
router.delete('/devices/:id', async (req: AuthRequest, res) => {
    try {
        await prisma.device.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error: any) {
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

// --- Attendance Management ---

router.get('/attendance', async (req: AuthRequest, res) => {
    try {
        const attendance = await prisma.loginSession.findMany({
            include: { user: { select: { name: true, username: true } }, device: { select: { device_identifier: true } } },
            orderBy: { login_timestamp: 'desc' }
        });
        res.json({ data: attendance });
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
