import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

const router = Router();

// Base authorization: Only Super Admin and Admin can enter this router
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

  // ROLE SECURITY: Admins can ONLY create SURVEYORS
  if (req.user!.role === 'ADMIN' && role !== 'SURVEYOR') {
      return res.status(403).json({ error: "Admins can only register new Surveyors" });
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
        linked_device_id: (role === 'SURVEYOR') ? (linked_device_id || null) : null
      }
    });

    if (role === 'SURVEYOR' && linked_device_id) {
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

router.put('/users/:id', async (req: AuthRequest, res) => {
    const { name, role, linked_device_id, password } = req.body;
    const userId = req.params.id as string;

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return res.status(404).json({ error: "User not found" });

        // HIERARCHY PROTECTION:
        // 1. No one touches SuperAdmin
        // 2. Admins cannot touch other Admins
        if (targetUser.role === 'SUPER_ADMIN' || (req.user!.role === 'ADMIN' && targetUser.role === 'ADMIN')) {
            return res.status(403).json({ error: "Insufficient permissions to modify this user" });
        }

        const updateData: any = { name, role, linked_device_id: linked_device_id || null };
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/users/:id', async (req: AuthRequest, res) => {
    const userId = req.params.id as string;
    try {
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return res.status(404).json({ error: "User not found" });

        // HIERARCHY PROTECTION
        if (targetUser.role === 'SUPER_ADMIN' || (req.user!.role === 'ADMIN' && targetUser.role === 'ADMIN')) {
            return res.status(403).json({ error: "Cannot delete higher or equal rank personnel" });
        }

        await prisma.$transaction([
            prisma.answer.deleteMany({ where: { response: { surveyor_id: userId } } }),
            prisma.response.deleteMany({ where: { surveyor_id: userId } }),
            prisma.loginSession.deleteMany({ where: { user_id: userId } }),
            prisma.auditLog.deleteMany({ where: { actor_user_id: userId } }),
            prisma.user.delete({ where: { id: userId } })
        ]);

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: "Deletion failed due to active field data" });
    }
});

router.patch('/users/:id/status', async (req: AuthRequest, res) => {
  const userId = req.params.id as string;
  const { status } = req.body;
  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (targetUser?.role === 'SUPER_ADMIN') return res.status(403).json({ error: "Cannot lock Root Admin" });

    const user = await prisma.user.update({
      where: { id: userId },
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
  const { device_identifier, device_name } = req.body;
  try {
    const existing = await prisma.device.findUnique({ where: { device_identifier } });
    if (existing) return res.status(409).json({ error: 'Device already registered' });

    const device = await prisma.device.create({
      data: { device_identifier, device_name }
    });
    res.status(201).json(device);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/devices/:id', async (req: AuthRequest, res) => {
    const deviceId = req.params.id as string;
    const { device_identifier, device_name } = req.body;
    try {
        const device = await prisma.device.update({
            where: { id: deviceId },
            data: { device_identifier, device_name }
        });
        res.json(device);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/devices/:id', async (req: AuthRequest, res) => {
    const deviceId = req.params.id as string;
    try {
        await prisma.device.delete({ where: { id: deviceId } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/devices/:id/status', async (req: AuthRequest, res) => {
  const deviceId = req.params.id as string;
  const { status } = req.body;
  try {
    const device = await prisma.device.update({
      where: { id: deviceId },
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
