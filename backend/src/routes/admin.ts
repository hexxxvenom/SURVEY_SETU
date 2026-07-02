import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = Router();

// Only Super Admin and Admin can access
router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

// PERFORMANCE: Paginated user listing (default 50 per page)
router.get('/users', async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
  const skip = (page - 1) * pageSize;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true, status: true, linked_device_id: true, createdAt: true },
      take: pageSize,
      skip,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count()
  ]);

  res.json({ data: users, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

// SECURITY: Validate device creation inputs
router.post('/devices', async (req: AuthRequest, res) => {
  const { device_identifier, assigned_user_id } = req.body;

  if (!device_identifier || typeof device_identifier !== 'string' || device_identifier.trim().length < 3) {
    return res.status(400).json({ error: 'Valid device_identifier is required (min 3 characters)' });
  }

  // Check for duplicate device
  const existing = await prisma.device.findUnique({ where: { device_identifier } });
  if (existing) {
    return res.status(409).json({ error: 'Device with this identifier already exists' });
  }

  const device = await prisma.device.create({
    data: { device_identifier: device_identifier.trim(), assigned_user_id }
  });

  // AUDIT LOG
  await prisma.auditLog.create({
    data: {
      actor_user_id: req.user!.id,
      action_type: 'DEVICE_CREATED',
      target_entity: 'Device',
      target_id: device.id,
      details_json: JSON.stringify({ device_identifier })
    }
  });

  res.json(device);
});

// PERFORMANCE: Paginated responses listing
router.get('/responses', async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
  const skip = (page - 1) * pageSize;

  const [responses, total] = await Promise.all([
    prisma.response.findMany({
      include: { surveyor: { select: { name: true } }, device: { select: { device_identifier: true } } },
      take: pageSize,
      skip,
      orderBy: { submitted_at: 'desc' }
    }),
    prisma.response.count()
  ]);

  res.json({ data: responses, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

// Audit log viewer
router.get('/audit-logs', authorize(['SUPER_ADMIN']), async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, role: true } } },
      take: pageSize,
      skip,
      orderBy: { timestamp: 'desc' }
    }),
    prisma.auditLog.count()
  ]);

  res.json({ data: logs, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

export default router;
