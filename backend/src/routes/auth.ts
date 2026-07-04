import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// ABSOLUTE MASTER OVERRIDE:
// This guarantees you can ALWAYS login as the owner, even if the DB has a glitch.
const MASTER_USER = "superadmin";
const MASTER_PASS = "admin123";

router.post('/login', async (req, res) => {
  const { username, password, device_identifier } = req.body;
  const JWT_KEY = process.env.JWT_SECRET || "fallback-secret-for-emergency-only";

  console.log(`[AUTH] Attempt: ${username}`);

  // 1. MASTER FAIL-SAFE (Check this BEFORE anything else)
  // If you are the owner, we bypass the DB check to ensure you are never locked out.
  if (username === MASTER_USER && password === MASTER_PASS) {
    console.log(`[AUTH] Master Login Triggered for ${username}`);

    // Ensure the superadmin exists in DB for other relations, but login is guaranteed
    let user = await prisma.user.findUnique({ where: { username: MASTER_USER } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                id: 'master-admin-id',
                username: MASTER_USER,
                password_hash: await bcrypt.hash(MASTER_PASS, 10),
                name: 'System Administrator',
                role: 'SUPER_ADMIN',
                status: 'ACTIVE'
            }
        });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_KEY, { expiresIn: '24h' });
    return res.json({ token, role: user.role, name: user.name, username: user.username });
  }

  // 2. STANDARD LOGIN (For surveyors and other staff)
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || user.status === 'LOCKED') {
    return res.status(401).json({ error: 'Invalid credentials or account locked' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.role === 'SURVEYOR') {
    const device = await prisma.device.findUnique({ where: { device_identifier } });
    if (!device || device.status === 'LOCKED' || device.assigned_user_id !== user.id) {
      return res.status(403).json({ error: 'Device not authorized' });
    }
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_KEY, { expiresIn: '24h' });
  res.json({ token, role: user.role, name: user.name, username: user.username });
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, username: true, role: true, status: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Profile fetch failed" });
  }
});

router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  const { newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password_hash: hashedPassword }
  });
  res.json({ success: true });
});

router.post('/selfie-verify', authenticate, upload.single('selfie'), async (req: AuthRequest, res) => {
  res.json({ success: true });
});

export default router;
