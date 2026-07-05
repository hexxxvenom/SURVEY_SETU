import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Publicly accessible for the app login screen
router.get('/app-branding', async (req, res) => {
    try {
        const config = await prisma.auditLog.findFirst({
            where: { action_type: 'UPDATE_APP_TITLE' },
            orderBy: { timestamp: 'desc' }
        });
        const title = config ? JSON.parse(config.details_json || '{}').title : "SurveySetu Login";
        res.json({ title });
    } catch (err) {
        res.json({ title: "SurveySetu Login" });
    }
});

// Admin only: Change the app login title
router.post('/app-branding', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthRequest, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    try {
        await prisma.auditLog.create({
            data: {
                actor_user_id: req.user!.id,
                action_type: 'UPDATE_APP_TITLE',
                target_entity: 'SystemConfig',
                target_id: 'app_title',
                details_json: JSON.stringify({ title })
            }
        });
        res.json({ success: true, title });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
