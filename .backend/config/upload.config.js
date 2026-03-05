"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileUrl = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_s3_1 = require("@aws-sdk/client-s3");
// @ts-ignore
const multer_s3_1 = __importDefault(require("multer-s3"));
const env_1 = require("./env");
// 1. Initialize S3 Client (only if needed)
const s3 = env_1.env.storageType === 'S3' ? new client_s3_1.S3Client({
    region: env_1.env.awsRegion,
    credentials: {
        accessKeyId: env_1.env.awsAccessKey,
        secretAccessKey: env_1.env.awsSecretKey,
    }
}) : null;
// 2. Local Disk Storage Setup (Fallback/Dev)
// On Vercel, we must use /tmp for uploads if DISK storage is used
const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel ? '/tmp/uploads' : 'uploads';
const profileDir = path_1.default.join(uploadDir, 'profiles');
const bannerDir = path_1.default.join(uploadDir, 'banners');
if (env_1.env.storageType === 'DISK') {
    [uploadDir, profileDir, bannerDir].forEach(dir => {
        try {
            if (!fs_1.default.existsSync(dir))
                fs_1.default.mkdirSync(dir, { recursive: true });
        }
        catch (error) {
            console.warn(`[UploadConfig] Could not create directory '${dir}'. This is expected on read-only serverless environments.`);
        }
    });
}
// 3. Define Storage Engine based on Env
let storage;
if (env_1.env.storageType === 'S3' && s3) {
    storage = (0, multer_s3_1.default)({
        s3: s3,
        bucket: env_1.env.s3BucketName,
        acl: 'public-read',
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const folder = file.fieldname === 'avatar' ? 'profiles' : 'events';
            cb(null, `${folder}/${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
        }
    });
}
else {
    storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const folder = file.fieldname === 'avatar' ? profileDir : bannerDir;
            cb(null, folder);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
        }
    });
}
// 4. File Filter & Multer Export
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPG, PNG, WebP images and PDF documents are allowed.'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});
/**
 * Utility to get the public URL of an uploaded file
 */
const getFileUrl = (file) => {
    if (env_1.env.storageType === 'S3') {
        return file.location; // Provided by multer-s3
    }
    // Local: Return relative path or full URL based on app config
    const baseUrl = env_1.env.apiUrl || 'http://localhost:4000';
    const filePath = file.path.replace(/\\/g, '/'); // Normalize paths for windows
    return `${baseUrl}/${filePath}`;
};
exports.getFileUrl = getFileUrl;
