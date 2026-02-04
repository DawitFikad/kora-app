import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const requiredEnv = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REDIS_URL',
    'CHAPA_SECRET_KEY',
    // 'SMS_PROVIDER_API_KEY', 
];

const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
    logger.warn({ missing }, '⚠️ Missing environment variables. Some features may not work.');
    // STRICT MODE DISABLED: Do not throw, allows partial startup
    // throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

// Helper to clean env vars (remove all quotes and trim)
const clean = (val?: string) => val ? val.replace(/["']/g, "").trim() : '';

export const env = {
    databaseUrl: clean(process.env.DATABASE_URL),
    apiUrl: clean(process.env.API_URL) ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
            (process.env.NODE_ENV === 'production' ? 'https://et-ticket-api-v2.vercel.app' : 'http://10.0.2.2:4000')),
    jwtSecret: clean(process.env.JWT_SECRET),
    redisUrl: clean(process.env.REDIS_URL),
    teleBirrMerchantAppId: clean(process.env.TELEBIRR_MERCHANT_APP_ID),
    teleBirrFabricAppId: clean(process.env.TELEBIRR_FABRIC_APP_ID),
    teleBirrShortCode: clean(process.env.TELEBIRR_SHORT_CODE),
    teleBirrAppSecret: clean(process.env.TELEBIRR_APP_SECRET),
    teleBirrPrivateKey: clean(process.env.TELEBIRR_PRIVATE_KEY),
    teleBirrApiUrl: clean(process.env.TELEBIRR_API_URL) || 'https://app.ethiotelebirr.et:9091',
    teleBirrTestMode: clean(process.env.TELEBIRR_TEST_MODE),
    cbeBirrKey: clean(process.env.CBE_BIRR_API_KEY),
    amoleKey: clean(process.env.AMOLE_API_KEY),
    chapaSecretKey: clean(process.env.CHAPA_SECRET_KEY),
    smsProviderKey: clean(process.env.SMS_PROVIDER_API_KEY),
    // Storage
    storageType: (process.env.STORAGE_TYPE || 'DISK') as 'DISK' | 'S3',
    awsRegion: clean(process.env.AWS_REGION) || 'us-east-1',
    awsAccessKey: clean(process.env.AWS_ACCESS_KEY_ID),
    awsSecretKey: clean(process.env.AWS_SECRET_ACCESS_KEY),
    s3BucketName: clean(process.env.S3_BUCKET_NAME),
};
