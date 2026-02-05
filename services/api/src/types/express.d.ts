import { Role } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                role: Role;
                organizerId?: number;
            };
            rawBody?: Buffer;
            file?: Express.Multer.File;
            files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
        }
    }
}
