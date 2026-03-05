"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
// Simplified logger for serverless compatibility
// pino-pretty doesn't work in Vercel serverless functions
const logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    // Use basic JSON output for serverless
    ...(process.env.NODE_ENV === 'development' && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
            },
        },
    })
});
exports.default = logger;
