import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import multer from 'multer';
import path from 'path';

const router = Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(authenticate);

router.post('/', upload.single('respondent_photo'), async (req: AuthRequest, res) => {
  const {
    survey_id,
    survey_version,
    device_id,
    gps_lat,
    gps_lng,
    answers,
    respondent_name,
    respondent_contact
  } = req.body;
  const surveyor_id = req.user!.id;

  console.log(`[RESPONSE] Incoming: Survey ${survey_id}, User: ${surveyor_id}, Device: ${device_id}`);

  if (!survey_id || !survey_version || !device_id) {
    console.error("[RESPONSE ERROR] Missing Core Headers");
    return res.status(400).json({ error: 'survey_id, survey_version, and device_id are required' });
  }

  // Find the internal DB ID for the hardware
  const device = await prisma.device.findUnique({
      where: { device_identifier: device_id }
  });

  if (!device) {
      console.error(`[RESPONSE ERROR] Hardware ${device_id} not authorized in CMS`);
      return res.status(404).json({ error: "Unauthorized hardware ID" });
  }

  let parsedAnswers: any[];
  try {
    parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
  } catch (_parseErr) {
    console.error("[RESPONSE ERROR] malformed JSON answers");
    return res.status(400).json({ error: 'Invalid answers format' });
  }

  try {
    const response = await prisma.response.create({
        data: {
          survey_id,
          survey_version: parseInt(survey_version.toString()),
          device_id: device.id, // Use internal UUID
          surveyor_id,
          respondent_name: respondent_name || "N/A",
          respondent_contact: respondent_contact || "N/A",
          gps_lat: gps_lat ? parseFloat(gps_lat.toString()) : null,
          gps_lng: gps_lng ? parseFloat(gps_lng.toString()) : null,
          respondent_photo_url: req.file ? `/uploads/${req.file.filename}` : null,
          answers: {
            create: parsedAnswers.map((a: any) => ({
              question_id: a.question_id,
              selected_option_id: a.selected_option_id
            }))
          }
        }
      });

      console.log(`[RESPONSE SUCCESS] Saved: ${response.id}`);
      res.status(201).json(response);
  } catch (err: any) {
      console.error("[RESPONSE DATABASE ERROR]", err);
      res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const skip = (page - 1) * pageSize;

  const history = await prisma.response.findMany({
      where: { surveyor_id: req.user!.id },
      include: { survey: { select: { title: true } } },
      take: pageSize,
      skip,
      orderBy: { submitted_at: 'desc' }
  });

  res.json({ data: history });
});

export default router;
