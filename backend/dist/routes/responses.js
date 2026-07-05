"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../prisma"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// SECURITY: Restrict uploads to images only, max 5MB
const upload = (0, multer_1.default)({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
        }
    }
});
router.use(auth_1.authenticate);
// Submit survey response — with safe JSON parsing and validation
router.post('/', upload.single('respondent_photo'), async (req, res) => {
    const { survey_id, survey_version, device_id, gps_lat, gps_lng, answers, respondent_name, // Added for new requirement
    respondent_contact // Added for new requirement
     } = req.body;
    const surveyor_id = req.user.id;
    // SECURITY: Validate required fields
    if (!survey_id || !survey_version || !device_id) {
        return res.status(400).json({ error: 'survey_id, survey_version, and device_id are required' });
    }
    // SECURITY: Safe JSON parse — don't crash on malformed input
    let parsedAnswers;
    try {
        parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
    }
    catch (_parseErr) {
        return res.status(400).json({ error: 'Invalid answers format. Must be valid JSON array.' });
    }
    if (!Array.isArray(parsedAnswers) || parsedAnswers.length === 0) {
        return res.status(400).json({ error: 'At least one answer is required' });
    }
    const respondent_photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const response = await prisma_1.default.response.create({
        data: {
            survey_id,
            survey_version: parseInt(survey_version),
            device_id,
            surveyor_id,
            respondent_name, // Added
            respondent_contact, // Added
            gps_lat: gps_lat ? parseFloat(gps_lat) : null,
            gps_lng: gps_lng ? parseFloat(gps_lng) : null,
            respondent_photo_url,
            answers: {
                create: parsedAnswers.map((a) => ({
                    question_id: a.question_id,
                    selected_option_id: a.selected_option_id
                }))
            }
        }
    });
    res.status(201).json(response);
});
// PERFORMANCE: Paginated history
router.get('/history', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;
    const [history, total] = await Promise.all([
        prisma_1.default.response.findMany({
            where: { surveyor_id: req.user.id },
            include: { survey: { select: { title: true } } },
            take: pageSize,
            skip,
            orderBy: { submitted_at: 'desc' }
        }),
        prisma_1.default.response.count({ where: { surveyor_id: req.user.id } })
    ]);
    res.json({ data: history, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});
exports.default = router;
