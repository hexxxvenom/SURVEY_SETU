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
  const { name, username, password, role } = req.body;
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

    // Handle audit logging safely - don't crash if AuditLog table has issues
    try {
      await prisma.auditLog.create({
        data: {
          actor_user_id: req.user!.id,
          action_type: `USER_${status}`,
          target_entity: 'User',
          target_id: user.id
        }
      });
    } catch (auditErr) {
      console.error("Audit logging failed:", auditErr);
    }

    res.json(user);
  } catch (error: any) {
    console.error("User status update failed:", error);
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

router.patch('/devices/:id/status', async (req: AuthRequest, res) => {
  const { status } = req.body;
  try {
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { status }
    });

    // Handle audit logging safely
    try {
      await prisma.auditLog.create({
        data: {
          actor_user_id: req.user!.id,
          action_type: `DEVICE_${status}`,
          target_entity: 'Device',
          target_id: device.id
        }
      });
    } catch (auditErr) {
      console.error("Audit logging failed:", auditErr);
    }

    res.json(device);
  } catch (error: any) {
    console.error("Device status update failed:", error);
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
