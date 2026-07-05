"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../prisma"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const uploadDir = 'uploads/attendance/';
// Ensure directory exists at runtime
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const upload = (0, multer_1.default)({ dest: uploadDir });
router.use(auth_1.authenticate);
// Clock-In with Selfie and GPS
router.post('/clock-in', upload.single('selfie'), async (req, res) => {
    const { device_id, gps_lat, gps_lng } = req.body;
    const user_id = req.user.id;
    try {
        const selfie_photo_url = req.file ? `/uploads/attendance/${req.file.filename}` : null;
        // FIND THE DEVICE RECORD
        const device = await prisma_1.default.device.findUnique({
            where: { device_identifier: device_id }
        });
        if (!device) {
            return res.status(404).json({ error: "Device hardware not found in registry" });
        }
        const session = await prisma_1.default.loginSession.create({
            data: {
                user_id,
                device_id: device.id, // Must use the DB internal UUID, not the identifier
                selfie_photo_url,
                gps_lat: gps_lat ? parseFloat(gps_lat) : null,
                gps_lng: gps_lng ? parseFloat(gps_lng) : null,
                login_timestamp: new Date()
            }
        });
        res.status(201).json(session);
    }
    catch (err) {
        console.error("[ATTENDANCE ERROR]", err);
        res.status(500).json({ error: err.message || "Internal Attendance Error" });
    }
});
// Clock-Out
router.post('/clock-out', async (req, res) => {
    const user_id = req.user.id;
    try {
        const lastSession = await prisma_1.default.loginSession.findFirst({
            where: { user_id, logout_timestamp: null },
            orderBy: { login_timestamp: 'desc' }
        });
        if (lastSession) {
            await prisma_1.default.loginSession.update({
                where: { id: lastSession.id },
                data: { logout_timestamp: new Date() }
            });
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
