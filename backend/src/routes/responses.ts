import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import multer from 'multer';
import path from 'path';

const router = Router();

// SECURITY: Restrict uploads to images only, max 5MB
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
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

router.use(authenticate);

// Submit survey response — with safe JSON parsing and validation
router.post('/', upload.single('respondent_photo'), async (req: AuthRequest, res) => {
  const {
    survey_id,
    survey_version,
    device_id,
    gps_lat,
    gps_lng,
    answers,
    respondent_name,     // Added for new requirement
    respondent_contact   // Added for new requirement
  } = req.body;
  const surveyor_id = req.user!.id;

  // SECURITY: Validate required fields
  if (!survey_id || !survey_version || !device_id) {
    return res.status(400).json({ error: 'survey_id, survey_version, and device_id are required' });
  }

  // SECURITY: Safe JSON parse — don't crash on malformed input
  let parsedAnswers: any[];
  try {
    parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
  } catch (_parseErr) {
    return res.status(400).json({ error: 'Invalid answers format. Must be valid JSON array.' });
  }

  if (!Array.isArray(parsedAnswers) || parsedAnswers.length === 0) {
    return res.status(400).json({ error: 'At least one answer is required' });
  }

  const respondent_photo_url = req.file ? `/uploads/${req.file.filename}` : null;

  const response = await prisma.response.create({
    data: {
      survey_id,
      survey_version: parseInt(survey_version),
      device_id,
      surveyor_id,
      respondent_name,      // Added
      respondent_contact,   // Added
      gps_lat: gps_lat ? parseFloat(gps_lat) : null,
      gps_lng: gps_lng ? parseFloat(gps_lng) : null,
      respondent_photo_url,
      answers: {
        create: parsedAnswers.map((a: any) => ({
          question_id: a.question_id,
          selected_option_id: a.selected_option_id
        }))
      }
    }
  });

  res.status(201).json(response);
});

// PERFORMANCE: Paginated history
router.get('/history', async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const skip = (page - 1) * pageSize;

  const [history, total] = await Promise.all([
    prisma.response.findMany({
      where: { surveyor_id: req.user!.id },
      include: { survey: { select: { title: true } } },
      take: pageSize,
      skip,
      orderBy: { submitted_at: 'desc' }
    }),
    prisma.response.count({ where: { surveyor_id: req.user!.id } })
  ]);

  res.json({ data: history, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

export default router;
