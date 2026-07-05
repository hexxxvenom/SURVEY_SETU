"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
require("express-async-errors");
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const surveys_1 = __importDefault(require("./routes/surveys"));
const responses_1 = __importDefault(require("./routes/responses"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const config_1 = __importDefault(require("./routes/config"));
// SECURITY: Load local .env only if not in production
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config();
}
// SECURITY: Crash immediately if critical env vars are missing
if (!process.env.JWT_SECRET) {
    console.log('--- DEBUG: Environment Variables ---');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT);
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
    console.log('------------------------------------');
    console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
    process.exit(1);
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security: Helmet sets secure HTTP headers (X-Content-Type-Options, HSTS, X-Frame-Options, etc.)
app.use((0, helmet_1.default)());
// Performance: Gzip compress all responses (~70% payload reduction for JSON)
app.use((0, compression_1.default)());
// Security: Allow origins based on environment variable
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : true;
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));
// Security: Limit request body size to prevent DoS via massive payloads
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve uploaded files statically (with helmet protection headers)
app.use('/uploads', express_1.default.static('uploads'));
// Setup routes
app.use('/auth', auth_1.default);
app.use('/admin', admin_1.default);
app.use('/surveys', surveys_1.default);
app.use('/responses', responses_1.default);
app.use('/attendance', attendance_1.default);
app.use('/config', config_1.default);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Global Error Handler – never leak stack traces to the client
app.use((err, req, res, _next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: statusCode === 500 ? 'Internal Server Error' : err.message
    });
});
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SurveySetu API running on port ${PORT}`);
});
