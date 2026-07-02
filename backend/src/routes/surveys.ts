import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import redisClient from '../redis';

const router = Router();

router.use(authenticate);

const ACTIVE_SURVEYS_CACHE_KEY = 'surveys:active';
const CACHE_TTL_SECONDS = 60; // 60 second cache

// PERFORMANCE: Cache active surveys in Redis (hit by every device on login/sync)
router.get('/active', async (_req, res) => {
  // Try Redis cache first
  try {
    const cached = await redisClient.get(ACTIVE_SURVEYS_CACHE_KEY);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  } catch (_cacheErr) {
    // Redis down — fall through to DB, don't crash
  }

  const surveys = await prisma.survey.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      questions: {
        orderBy: { order_index: 'asc' },
        include: { 
          options: { orderBy: { order_index: 'asc' } } 
        }
      }
    }
  });

  // Store in cache (non-blocking)
  redisClient.setex(ACTIVE_SURVEYS_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(surveys)).catch(() => {});

  res.json(surveys);
});

// Editors manage surveys — with input validation
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (req: AuthRequest, res) => {
  const { title, language, questions } = req.body;
  
  // SECURITY: Input validation
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ error: 'Survey title is required (min 3 characters)' });
  }
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'At least one question is required' });
  }
  for (const q of questions) {
    if (!q.question_text || typeof q.question_text !== 'string') {
      return res.status(400).json({ error: 'Each question must have question_text' });
    }
    if (!q.options || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) {
      return res.status(400).json({ error: 'Each question must have 2-4 options' });
    }
  }

  const survey = await prisma.survey.create({
    data: {
      title: title.trim(),
      language: language || 'en',
      created_by: req.user?.id,
      questions: {
        create: questions.map((q: any, index: number) => ({
          question_text: q.question_text.trim(),
          order_index: q.order_index ?? index + 1,
          option_count: q.options.length,
          is_mandatory: q.is_mandatory ?? true,
          options: {
            create: q.options.map((o: any, oIndex: number) => ({
              option_text: o.option_text.trim(),
              order_index: o.order_index ?? oIndex + 1
            }))
          }
        }))
      }
    }
  });
  
  // Invalidate cache when a new survey is created
  redisClient.del(ACTIVE_SURVEYS_CACHE_KEY).catch(() => {});

  // AUDIT LOG
  await prisma.auditLog.create({
    data: {
      actor_user_id: req.user!.id,
      action_type: 'SURVEY_CREATED',
      target_entity: 'Survey',
      target_id: survey.id,
      details_json: JSON.stringify({ title: survey.title })
    }
  });

  res.status(201).json(survey);
});

export default router;
