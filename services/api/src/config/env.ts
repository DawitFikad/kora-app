import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const requiredEnv = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REDIS_URL',
    'DATABASE_URL',
    'JWT_SECRET',
    'REDIS_URL',
    'CHAPA_SECRET_KEY',
    // 'SMS_PROVIDER_API_KEY', 
];

const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
    logger.error({ missing }, 'Missing required environment variables');
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

export const env = {
    databaseUrl: process.env.DATABASE_URL as string,
    jwtSecret: process.env.JWT_SECRET as string,
    redisUrl: process.env.REDIS_URL as string,
    teleBirrMerchantAppId: process.env.TELEBIRR_MERCHANT_APP_ID as string,
    teleBirrFabricAppId: process.env.TELEBIRR_FABRIC_APP_ID as string,
    teleBirrShortCode: process.env.TELEBIRR_SHORT_CODE as string,
    teleBirrAppSecret: process.env.TELEBIRR_APP_SECRET as string,
    teleBirrPrivateKey: process.env.TELEBIRR_PRIVATE_KEY as string,
    cbeBirrKey: process.env.CBE_BIRR_API_KEY as string,
    amoleKey: process.env.AMOLE_API_KEY as string,
    chapaSecretKey: process.env.CHAPA_SECRET_KEY as string,
    smsProviderKey: process.env.SMS_PROVIDER_API_KEY as string,
};
