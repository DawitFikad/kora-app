import pino from 'pino';

// Simplified logger for serverless compatibility
// pino-pretty doesn't work in Vercel serverless functions
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    // Redact sensitive PII and financial info (§10)
    redact: {
        paths: [
            'phoneNumber', 'email', 'pin', 'password', 'payoutDetails',
            'bankAccount', 'shortCode', 'receiverShortCode', 'contactPhone',
            '*.phoneNumber', '*.email', '*.payoutDetails'
        ],
        censor: '[REDACTED]'
    },
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

export default logger;
