"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Railway provides REDIS_URL or REDIS_PRIVATE_URL.
// We use a fallback that won't crash the app if Redis is temporarily unavailable.
const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
const redisClient = new ioredis_1.default(redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    // If no URL is found, we don't want to crash on '::1' connection attempts
    lazyConnect: !redisUrl
});
redisClient.on('error', (err) => {
    // Only log if we actually have a URL, otherwise ignore local connection failures
    if (redisUrl) {
        console.error('Redis Client Error:', err.message);
    }
});
exports.default = redisClient;
