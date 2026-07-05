import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

const router = Router();

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
  try {
    const user = await prisma.user.create({
      data: {
        name, username,
        password_hash: await bcrypt.hash(password, 10),
        role, linked_device_id: linked_device_id || null
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

router.patch('/users/:id/status', async (req: AuthRequest, res) => {
  const { status } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json(user);
});

// --- Device Management (Updated with Name) ---
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
  const { device_identifier, device_name } = req.body;
  try {
    const device = await prisma.device.create({
      data: { device_identifier, device_name }
    });
    res.status(201).json(device);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/devices/:id', async (req: AuthRequest, res) => {
    const { device_identifier, device_name } = req.body;
    const device = await prisma.device.update({
        where: { id: req.params.id },
        data: { device_identifier, device_name }
    });
    res.json(device);
});

router.delete('/devices/:id', async (req: AuthRequest, res) => {
    await prisma.device.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});

router.patch('/devices/:id/status', async (req: AuthRequest, res) => {
  const { status } = req.body;
  const device = await prisma.device.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json(device);
});

// --- Response Management ---
router.get('/responses', async (req: AuthRequest, res) => {
  try {
    const responses = await prisma.response.findMany({
      include: {
        surveyor: { select: { name: true, username: true } },
        device: { select: { device_identifier: true, device_name: true } },
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
