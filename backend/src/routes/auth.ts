import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../prisma';
import multer from 'multer';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// SECURITY: File upload validation — only images, max 5MB
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

const JWT_SECRET = process.env.JWT_SECRET!;

// SECURITY: Brute-force protection — 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password, device_identifier } = req.body;

  if (!username || !password || !device_identifier) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  // SECURITY: Constant-time lookup — always run bcrypt even if user not found
  // to prevent timing attacks that leak valid usernames
  const user = await prisma.user.findUnique({ where: { username } });
  
  if (!user) {
    // Run a dummy bcrypt compare to keep response time consistent
    await bcrypt.compare(password, '$2a$10$dummyhashtopreventtimingattacks000000000000');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.status === 'LOCKED') {
    return res.status(403).json({ error: 'Account is locked. Contact your administrator.' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Device check for SURVEYOR — single query, reuse result
  let deviceRecord: any = null;
  if (user.role === 'SURVEYOR') {
    deviceRecord = await prisma.device.findUnique({ where: { device_identifier } });
    if (!deviceRecord) {
      return res.status(403).json({ error: 'Device not registered' });
    }
    if (deviceRecord.assigned_user_id !== user.id) {
      return res.status(403).json({ error: 'Device not assigned to this user' });
    }
    if (deviceRecord.status === 'LOCKED') {
      return res.status(403).json({ error: 'Device is locked. Contact your administrator.' });
    }
    // Update last seen (non-blocking — don't await)
    prisma.device.update({
      where: { id: deviceRecord.id },
      data: { last_seen_at: new Date() }
    }).catch(() => {}); // Fire and forget for performance
  }

  // Generate Token with short expiry
  const tokenPayload = {
    id: user.id,
    role: user.role,
    device_id: user.role === 'SURVEYOR' ? device_identifier : undefined
  };
  
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

  // Create login session if surveyor — reuse cached device record
  let requireSelfie = false;
  let sessionId = null;
  if (user.role === 'SURVEYOR' && deviceRecord) {
    const session = await prisma.loginSession.create({
      data: {
        user_id: user.id,
        device_id: deviceRecord.id, // Reused, no extra DB call
      }
    });
    requireSelfie = true;
    sessionId = session.id;
  }

  res.json({ token, requireSelfie, sessionId, role: user.role });
});

router.post('/selfie-verify', authenticate, upload.single('selfie'), async (req: AuthRequest, res) => {
  const { sessionId } = req.body;
  if (!req.file || !sessionId) {
    return res.status(400).json({ error: 'Selfie image and sessionId are required' });
  }

  // Verify that the session belongs to the authenticated user
  const session = await prisma.loginSession.findUnique({ where: { id: sessionId } });
  if (!session || session.user_id !== req.user!.id) {
    return res.status(403).json({ error: 'Session does not belong to this user' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  await prisma.loginSession.update({
    where: { id: sessionId },
    data: { selfie_photo_url: fileUrl }
  });

  res.json({ success: true, fileUrl });
});

export default router;
