import { Request, Response } from "express";
import { PrismaClient, AccountStatus, Role } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Parse DATABASE_URL and ensure password is a string for SCRAM authentication
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

let url: URL;
try {
    url = new URL(databaseUrl);
} catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${databaseUrl}`);
}

const pool = new pg.Pool({
    host: url.hostname,
    port: parseInt(url.port),
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class AdminController {
    // Get all users with optional filters
    static async getAllUsers(req: Request, res: Response) {
        try {
            const { role, status } = req.query;

            const filters: any = {};
            if (role) filters.role = role as Role;
            if (status) filters.status = status as AccountStatus;

            const users = await prisma.user.findMany({
                where: filters,
                select: {
                    id: true,
                    phoneNumber: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json({ users, count: users.length });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Approve a pending organizer
    static async approveOrganizer(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const user = await prisma.user.findUnique({
                where: { id: parseInt(userId) }
            });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            if (user.role !== Role.ORGANIZER) {
                return res.status(400).json({ error: "User is not an organizer" });
            }

            if (user.status !== AccountStatus.PENDING) {
                return res.status(400).json({ error: `User status is already ${user.status}` });
            }

            const updatedUser = await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: AccountStatus.ACTIVE }
            });

            res.json({
                message: "Organizer approved successfully",
                user: {
                    id: updatedUser.id,
                    phoneNumber: updatedUser.phoneNumber,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    status: updatedUser.status
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Suspend a user
    static async suspendUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const updatedUser = await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: AccountStatus.SUSPENDED }
            });

            res.json({
                message: "User suspended successfully",
                user: {
                    id: updatedUser.id,
                    phoneNumber: updatedUser.phoneNumber,
                    status: updatedUser.status
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Activate a suspended user
    static async activateUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const updatedUser = await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: AccountStatus.ACTIVE }
            });

            res.json({
                message: "User activated successfully",
                user: {
                    id: updatedUser.id,
                    phoneNumber: updatedUser.phoneNumber,
                    status: updatedUser.status
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Create admin user (for testing/setup only - should be protected in production)
    static async createAdmin(req: Request, res: Response) {
        try {
            const { phoneNumber, email, firstName, lastName } = req.body;

            if (!phoneNumber) {
                return res.status(400).json({ error: "Phone number is required" });
            }

            const existingUser = await prisma.user.findUnique({
                where: { phoneNumber }
            });

            if (existingUser) {
                return res.status(400).json({ error: "User with this phone number already exists" });
            }

            const admin = await prisma.user.create({
                data: {
                    phoneNumber,
                    email,
                    firstName,
                    lastName,
                    role: Role.ADMIN,
                    status: AccountStatus.ACTIVE
                }
            });

            res.json({
                message: "Admin created successfully",
                admin: {
                    id: admin.id,
                    phoneNumber: admin.phoneNumber,
                    email: admin.email,
                    role: admin.role,
                    status: admin.status
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
