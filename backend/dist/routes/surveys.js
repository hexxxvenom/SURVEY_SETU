"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Public/App: Get active surveys
router.get('/active', async (_req, res) => {
    try {
        const surveys = await prisma_1.default.survey.findMany({
            where: { status: 'PUBLISHED' },
            include: {
                questions: {
                    orderBy: { order_index: 'asc' },
                    include: { options: { orderBy: { order_index: 'asc' } } }
                }
            }
        });
        res.json(surveys);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Admin: Get all surveys for management
router.get('/all', (0, auth_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (req, res) => {
    try {
        const surveys = await prisma_1.default.survey.findMany({
            include: { questions: true },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ data: surveys });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Admin: Create survey
router.post('/', (0, auth_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (req, res) => {
    const { title, language, questions, status } = req.body;
    console.log(`[SURVEY] Creation attempt: ${title} (${status})`);
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Title and at least one question required' });
    }
    try {
        const survey = await prisma_1.default.survey.create({
            data: {
                title: title.trim(),
                language: language || 'en',
                status: status || 'DRAFT',
                created_by: req.user?.id,
                questions: {
                    create: questions.map((q, index) => ({
                        question_text: (q.text || q.question_text).trim(),
                        order_index: index + 1,
                        option_count: q.options.length,
                        is_mandatory: q.isMandatory ?? q.is_mandatory ?? true,
                        options: {
                            create: q.options.map((o, oIndex) => ({
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
    }
    catch (err) {
        console.error("[SURVEY ERROR]", err);
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
