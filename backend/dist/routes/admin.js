"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(['SUPER_ADMIN', 'ADMIN']));
// --- User Management ---
router.get('/users', async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: { id: true, name: true, username: true, role: true, status: true, linked_device_id: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ data: users });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/users', async (req, res) => {
    const { name, username, password, role, linked_device_id } = req.body;
    if (!name || !username || !password || !role) {
        return res.status(400).json({ error: 'All core fields are required' });
    }
    try {
        const existing = await prisma_1.default.user.findUnique({ where: { username } });
        if (existing)
            return res.status(409).json({ error: 'Username already taken' });
        const user = await prisma_1.default.user.create({
            data: {
                name,
                username,
                password_hash: await bcryptjs_1.default.hash(password, 10),
                role,
                linked_device_id: linked_device_id || null
            }
        });
        if (linked_device_id) {
            await prisma_1.default.device.update({
                where: { device_identifier: linked_device_id },
                data: { assigned_user_id: user.id }
            });
        }
        res.status(201).json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/users/:id', async (req, res) => {
    const { name, role, linked_device_id, password } = req.body;
    const userId = req.params.id;
    try {
        const updateData = { name, role, linked_device_id: linked_device_id || null };
        if (password) {
            updateData.password_hash = await bcryptjs_1.default.hash(password, 10);
        }
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: updateData
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const userToDelete = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (userToDelete?.username === 'superadmin')
            return res.status(403).json({ error: "Cannot delete Root Admin" });
        await prisma_1.default.$transaction([
            prisma_1.default.answer.deleteMany({ where: { response: { surveyor_id: userId } } }),
            prisma_1.default.response.deleteMany({ where: { surveyor_id: userId } }),
            prisma_1.default.loginSession.deleteMany({ where: { user_id: userId } }),
            prisma_1.default.auditLog.deleteMany({ where: { actor_user_id: userId } }),
            prisma_1.default.user.delete({ where: { id: userId } })
        ]);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Cascade Delete Failed:", error);
        res.status(500).json({ error: "Cannot delete user. They have active dependencies." });
    }
});
router.patch('/users/:id/status', async (req, res) => {
    const userId = req.params.id;
    const { status } = req.body;
    try {
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { status }
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Device Management ---
router.get('/devices', async (req, res) => {
    try {
        const devices = await prisma_1.default.device.findMany({
            include: { user: { select: { name: true, username: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ data: devices });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/devices', async (req, res) => {
    const { device_identifier, device_name } = req.body;
    try {
        const existing = await prisma_1.default.device.findUnique({ where: { device_identifier } });
        if (existing)
            return res.status(409).json({ error: 'Device already registered' });
        const device = await prisma_1.default.device.create({
            data: { device_identifier, device_name }
        });
        res.status(201).json(device);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/devices/:id', async (req, res) => {
    const deviceId = req.params.id;
    const { device_identifier, device_name } = req.body;
    try {
        const device = await prisma_1.default.device.update({
            where: { id: deviceId },
            data: { device_identifier, device_name }
        });
        res.json(device);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/devices/:id', async (req, res) => {
    const deviceId = req.params.id;
    try {
        await prisma_1.default.device.delete({ where: { id: deviceId } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.patch('/devices/:id/status', async (req, res) => {
    const deviceId = req.params.id;
    const { status } = req.body;
    try {
        const device = await prisma_1.default.device.update({
            where: { id: deviceId },
            data: { status }
        });
        res.json(device);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Attendance Management ---
router.get('/attendance', async (req, res) => {
    try {
        const attendance = await prisma_1.default.loginSession.findMany({
            include: { user: { select: { name: true, username: true } }, device: { select: { device_identifier: true } } },
            orderBy: { login_timestamp: 'desc' }
        });
        res.json({ data: attendance });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Response Management ---
router.get('/responses', async (req, res) => {
    try {
        const responses = await prisma_1.default.response.findMany({
            include: {
                surveyor: { select: { name: true, username: true } },
                device: { select: { device_identifier: true, device_name: true } },
                survey: { select: { title: true } },
                answers: { include: { question: true, selectedOption: true } }
            },
            orderBy: { submitted_at: 'desc' }
        });
        res.json({ data: responses });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
