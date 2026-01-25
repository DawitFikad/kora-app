declare module 'multer-s3' {
    import { StorageEngine } from 'multer';
    import { S3Client } from '@aws-sdk/client-s3';

    interface Options {
        s3: S3Client;
        bucket: ((req: any, file: any, cb: (error: any, bucket?: string) => void) => void) | string;
        key?(req: any, file: any, cb: (error: any, key?: string) => void): void;
        acl?: ((req: any, file: any, cb: (error: any, acl?: string) => void) => void) | string;
        contentType?: ((req: any, file: any, cb: (error: any, mime?: string, stream?: any) => void) => void) | any;
        metadata?(req: any, file: any, cb: (error: any, metadata?: any) => void): void;
        cacheControl?: ((req: any, file: any, cb: (error: any, cacheControl?: string) => void) => void) | string;
        serverSideEncryption?: ((req: any, file: any, cb: (error: any, serverSideEncryption?: string) => void) => void) | string;
    }

    interface MulterS3 {
        (options: Options): StorageEngine;
        AUTO_CONTENT_TYPE: any;
        DEFAULT_CONTENT_TYPE: any;
    }

    const multerS3: MulterS3;
    export default multerS3;
}
