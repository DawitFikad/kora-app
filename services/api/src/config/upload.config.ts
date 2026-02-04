import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
// @ts-ignore
import multerS3 from 'multer-s3';
import { env } from './env';

// 1. Initialize S3 Client (only if needed)
const s3 = env.storageType === 'S3' ? new S3Client({
    region: env.awsRegion,
    credentials: {
        accessKeyId: env.awsAccessKey,
        secretAccessKey: env.awsSecretKey,
    }
}) : null;

// 2. Local Disk Storage Setup (Fallback/Dev)
// On Vercel, we must use /tmp for uploads if DISK storage is used
const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel ? '/tmp/uploads' : 'uploads';
const profileDir = path.join(uploadDir, 'profiles');
const bannerDir = path.join(uploadDir, 'banners');

if (env.storageType === 'DISK') {
    [uploadDir, profileDir, bannerDir].forEach(dir => {
        try {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        } catch (error) {
            console.warn(`[UploadConfig] Could not create directory '${dir}'. This is expected on read-only serverless environments.`);
        }
    });
}

// 3. Define Storage Engine based on Env
let storage: multer.StorageEngine;

if (env.storageType === 'S3' && s3) {
    storage = multerS3({
        s3: s3,
        bucket: env.s3BucketName,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req: any, file: any, cb: any) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req: any, file: any, cb: any) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const folder = file.fieldname === 'avatar' ? 'profiles' : 'events';
            cb(null, `${folder}/${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });
} else {
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const folder = file.fieldname === 'avatar' ? profileDir : bannerDir;
            cb(null, folder);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });
}

// 4. File Filter & Multer Export
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, WebP images and PDF documents are allowed.'));
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});

/**
 * Utility to get the public URL of an uploaded file
 */
export const getFileUrl = (file: any): string => {
    if (env.storageType === 'S3') {
        return file.location; // Provided by multer-s3
    }
    // Local: Return relative path or full URL based on app config
    const baseUrl = env.apiUrl || 'http://localhost:4000';
    const filePath = file.path.replace(/\\/g, '/'); // Normalize paths for windows
    return `${baseUrl}/${filePath}`;
};
