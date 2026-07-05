"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// RECOVERY CONFIG (Only used if user is missing from DB)
const MASTER_USER = "superadmin";
const DEFAULT_PASS = "admin123";
router.post('/login', async (req, res) => {
    const { username, password, device_identifier } = req.body;
    const JWT_KEY = process.env.JWT_SECRET || "fallback-secret-for-emergency-only";
    console.log(`[AUTH] Attempt: ${username}`);
    // 1. Fetch User from Database
    let user = await prisma_1.default.user.findUnique({ where: { username } });
    // 2. EMERGENCY AUTO-REPAIR:
    // If master user is deleted from DB, recreate it with default pass.
    // This ONLY runs if the database is literally empty for this user.
    if (!user && username === MASTER_USER) {
        console.log(`[AUTH] Emergency Re-seeding Master Admin...`);
        user = await prisma_1.default.user.create({
            data: {
                id: 'master-admin-id',
                username: MASTER_USER,
                password_hash: await bcryptjs_1.default.hash(DEFAULT_PASS, 10),
                name: 'System Administrator',
                role: 'SUPER_ADMIN',
                status: 'ACTIVE'
            }
        });
    }
    // 3. VALIDATE USER
    if (!user || user.status === 'LOCKED') {
        return res.status(401).json({ error: 'Invalid credentials or account locked' });
    }
    // 4. SECURE PASSWORD CHECK
    // We NOW strictly check against the database hash.
    // Old "admin123" bypass is removed to support password changes.
    const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    // 5. Device Binding for Surveyors
    if (user.role === 'SURVEYOR') {
        const device = await prisma_1.default.device.findUnique({ where: { device_identifier } });
        if (!device || device.status === 'LOCKED' || device.assigned_user_id !== user.id) {
            return res.status(403).json({ error: 'Device not authorized' });
        }
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_KEY, { expiresIn: '24h' });
    res.json({ token, role: user.role, name: user.name, username: user.username });
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, username: true, role: true, status: true }
        });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ error: "Profile fetch failed" });
    }
});
router.post('/change-password', auth_1.authenticate, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.default.user.update({
        where: { id: req.user.id },
        data: { password_hash: hashedPassword }
    });
    res.json({ success: true });
});
router.post('/selfie-verify', auth_1.authenticate, upload.single('selfie'), async (req, res) => {
    res.json({ success: true });
});
exports.default = router;
