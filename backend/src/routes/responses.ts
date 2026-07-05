import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

// ULTIMATE RESPONSE SUBMISSION ENGINE
router.post('/', upload.single('respondent_photo'), async (req: AuthRequest, res) => {
  const {
    survey_id,
    survey_version,
    device_id, // This is the physical Hardware ID (e.g. 8fc5...)
    gps_lat,
    gps_lng,
    answers,
    respondent_name,
    respondent_contact
  } = req.body;
  const surveyor_id = req.user!.id;

  console.log(`[CLOUD-SYNC] Incoming Response from User: ${surveyor_id} on Device: ${device_id}`);

  try {
    // 1. DYNAMIC HARDWARE LOOKUP
    // The app sends the physical ID, but the DB needs the internal UUID
    const deviceRecord = await prisma.device.findUnique({
        where: { device_identifier: device_id }
    });

    if (!deviceRecord) {
        console.error(`[SYNC ERROR] Device ${device_id} is not registered in CMS!`);
        return res.status(404).json({ error: "Device not authorized in registry" });
    }

    // 2. DATA PARSING
    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;

    // 3. ATOMIC DATABASE COMMIT
    const response = await prisma.response.create({
        data: {
          survey_id,
          survey_version: parseInt(survey_version.toString()),
          device_id: deviceRecord.id, // Linked via internal UUID
          surveyor_id,
          respondent_name: respondent_name || "Anonymous",
          respondent_contact: respondent_contact || "N/A",
          gps_lat: gps_lat ? parseFloat(gps_lat.toString()) : null,
          gps_lng: gps_lng ? parseFloat(gps_lng.toString()) : null,
          answers: {
            create: parsedAnswers.map((a: any) => ({
              question_id: a.question_id,
              selected_option_id: a.selected_option_id
            }))
          }
        }
      });

      console.log(`[SYNC SUCCESS] Entry ${response.id} is now LIVE in CMS`);
      res.status(201).json({ success: true, id: response.id });
  } catch (err: any) {
      console.error("[CRITICAL DB ERROR]", err);
      res.status(500).json({ error: "Cloud storage failed. Verify database connectivity." });
  }
});

router.get('/history', async (req: AuthRequest, res) => {
  try {
    const history = await prisma.response.findMany({
        where: { surveyor_id: req.user!.id },
        include: { survey: { select: { title: true } } },
        orderBy: { submitted_at: 'desc' }
    });
    res.json({ data: history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
