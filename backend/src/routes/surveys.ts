import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import redisClient from '../redis';

const router = Router();

router.use(authenticate);

const ACTIVE_SURVEYS_CACHE_KEY = 'surveys:active';

// Public/App: Get active surveys
router.get('/active', async (_req, res) => {
  const surveys = await prisma.survey.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      questions: {
        orderBy: { order_index: 'asc' },
        include: { options: { orderBy: { order_index: 'asc' } } }
      }
    }
  });
  res.json(surveys);
});

// Admin: Create/Update survey with status
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (req: AuthRequest, res) => {
  const { title, language, questions, status } = req.body;
  
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
              question_text: q.text.trim(),
              order_index: index + 1,
              option_count: q.options.length,
              is_mandatory: q.isMandatory ?? true,
              options: {
                create: q.options.map((o: any, oIndex: number) => ({
                  option_text: o.text.trim(),
                  order_index: oIndex + 1
                }))
              }
            }))
          }
        }
      });
      res.status(201).json(survey);
  } catch (err: any) {
      res.status(500).json({ error: err.message });
  }
});

export default router;
