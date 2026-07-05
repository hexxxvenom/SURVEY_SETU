"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Publicly accessible for the app login screen
router.get('/app-branding', async (req, res) => {
    try {
        const config = await prisma_1.default.auditLog.findFirst({
            where: { action_type: 'UPDATE_APP_TITLE' },
            orderBy: { timestamp: 'desc' }
        });
        const title = config ? JSON.parse(config.details_json || '{}').title : "SurveySetu Login";
        res.json({ title });
    }
    catch (err) {
        res.json({ title: "SurveySetu Login" });
    }
});
// Admin only: Change the app login title
router.post('/app-branding', auth_1.authenticate, (0, auth_1.authorize)(['SUPER_ADMIN']), async (req, res) => {
    const { title } = req.body;
    if (!title)
        return res.status(400).json({ error: "Title is required" });
    try {
        await prisma_1.default.auditLog.create({
            data: {
                actor_user_id: req.user.id,
                action_type: 'UPDATE_APP_TITLE',
                target_entity: 'SystemConfig',
                target_id: 'app_title',
                details_json: JSON.stringify({ title })
            }
        });
        res.json({ success: true, title });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
