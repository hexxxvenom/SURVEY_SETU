import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = Router();

router.use(authenticate);

// Public/App: Get active surveys
router.get('/active', async (_req, res) => {
  try {
    const surveys = await prisma.survey.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        questions: {
          orderBy: { order_index: 'asc' },
          include: { options: { orderBy: { order_index: 'asc' } } }
        }
      }
    });

    // Debug log to check if surveys are found
    console.log(`[APP-FETCH] Active surveys requested. Found: ${surveys.length}`);

    res.json(surveys);
  } catch (err: any) {
    console.error("[APP-FETCH ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all surveys for management
router.get('/all', authorize(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (req: AuthRequest, res) => {
    try {
      const surveys = await prisma.survey.findMany({
        include: { questions: true },
        orderBy: { updatedAt: 'desc' }
      });
      res.json({ data: surveys });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
});

// Admin: Create survey
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (req: AuthRequest, res) => {
  const { title, language, questions, status } = req.body;
  
  console.log(`[SURVEY] Creation attempt: ${title} (${status})`);

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Title and at least one question required' });
  }

  try {
    const survey = await prisma.survey.create({
        data: {
          title: title.trim(),
          language: language || 'en',
          status: status || 'DRAFT',
          created_by: req.user?.id,
          questions: {
            create: questions.map((q: any, index: number) => ({
              question_text: (q.text || q.question_text).trim(),
              order_index: index + 1,
              option_count: q.options.length,
              is_mandatory: q.isMandatory ?? q.is_mandatory ?? true,
              options: {
                create: q.options.map((o: any, oIndex: number) => ({
                  option_text: (o.text || o.option_text).trim(),
                  order_index: oIndex + 1
                }))
              }
            }))
          }
        }
      });

      console.log(`[SURVEY] Success: ${survey.id}`);
      res.status(201).json(survey);
  } catch (err: any) {
      console.error("[SURVEY ERROR]", err);
      res.status(500).json({ error: err.message });
  }
});

export default router;
