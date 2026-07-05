import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/attendance/' });

router.use(authenticate);

// Clock-In with Selfie and GPS
router.post('/clock-in', upload.single('selfie'), async (req: AuthRequest, res) => {
  const { device_id, gps_lat, gps_lng } = req.body;
  const user_id = req.user!.id;

  try {
    const selfie_photo_url = req.file ? `/uploads/attendance/${req.file.filename}` : null;

    const session = await prisma.loginSession.create({
      data: {
        user_id,
        device_id,
        selfie_photo_url,
        gps_lat: gps_lat ? parseFloat(gps_lat) : null,
        gps_lng: gps_lng ? parseFloat(gps_lng) : null,
        login_timestamp: new Date()
      }
    });

    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clock-Out
router.post('/clock-out', async (req: AuthRequest, res) => {
  const user_id = req.user!.id;

  try {
    // Find the latest active session for this user
    const lastSession = await prisma.loginSession.findFirst({
      where: { user_id, logout_timestamp: null },
      orderBy: { login_timestamp: 'desc' }
    });

    if (lastSession) {
      await prisma.loginSession.update({
        where: { id: lastSession.id },
        data: { logout_timestamp: new Date() }
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
