import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import multer from 'multer';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET!;

router.post('/login', async (req, res) => {
  const { username, password, device_identifier } = req.body;

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
      return res.status(403).json({ error: 'Device not registered, locked, or not assigned to this user' });
    }
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, role: user.role, name: user.name, username: user.username });
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, username: true, role: true, status: true }
  });

  if (user?.status === 'LOCKED') {
    return res.status(403).json({ error: 'Account locked' });
  }

  res.json(user);
});

router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password_hash: hashedPassword }
  });

  res.json({ success: true });
});

router.post('/selfie-verify', authenticate, upload.single('selfie'), async (req: AuthRequest, res) => {
  // Logic for selfie upload
  res.json({ success: true });
});

export default router;
