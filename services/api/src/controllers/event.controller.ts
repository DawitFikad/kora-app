import { Request, Response } from "express";
import { EventService } from "../services/event.service";
import { EventStatus, Role } from "@prisma/client";
import { ProfileService } from "../services/profile.service";

export class EventController {
    // --- Public Discovery ---

    static async getPersonalizedPicks(req: Request, res: Response) {
        try {
            const filters = req.query as any;
            const picks = await EventService.listPersonalizedPicks({
                userId: req.user?.userId as number | undefined,
                cityId: filters.cityId ? parseInt(String(filters.cityId), 10) : undefined,
                limit: filters.limit ? parseInt(String(filters.limit), 10) : undefined,
            });
            res.json(picks);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getUpcomingAwards(req: Request, res: Response) {
        try {
            const filters = req.query as any;
            const awards = await EventService.listUpcomingAwards({
                cityId: filters.cityId ? parseInt(String(filters.cityId), 10) : undefined,
                limit: filters.limit ? parseInt(String(filters.limit), 10) : undefined,
            });
            res.json(awards);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getTrendingNow(req: Request, res: Response) {
        try {
            const filters = req.query as any;
            const events = await EventService.listTrendingNow({
                limit: filters.limit ? parseInt(String(filters.limit), 10) : undefined
            });
            res.json(events);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getBestThisWeek(req: Request, res: Response) {
        try {
            const filters = req.query as any;
            const events = await EventService.listBestEventsThisWeek({
                cityId: filters.cityId ? parseInt(String(filters.cityId), 10) : undefined,
                limit: filters.limit ? parseInt(String(filters.limit), 10) : undefined
            });
            res.json(events);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getRecommendedMovies(req: Request, res: Response) {
        try {
            const filters = req.query as any;
            const userId = req.user?.userId as number | undefined;
            const movies = await EventService.listRecommendedMovies({
                userId,
                cityId: filters.cityId ? parseInt(String(filters.cityId), 10) : undefined,
                limit: filters.limit ? parseInt(String(filters.limit), 10) : undefined
            });
            res.json(movies);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getAllEvents(req: Request, res: Response) {
        try {
            const filters = req.query as any;
            const events = await EventService.listEvents(filters);
            res.json(events);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const event = await EventService.getEventDetails(parseInt(id));

            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }

            // Only permit viewing if APPROVED or if requester is OWNER/ADMIN
            // Only permit viewing if APPROVED or if requester is OWNER/ADMIN
            let isOwner = false;
            if (req.user && req.user.role === Role.ORGANIZER) {
                try {
                    const organizer = await ProfileService.getOrganizerProfile(req.user.userId);
                    isOwner = organizer.id === event.organizerId;
                } catch (e) {
                    isOwner = false;
                }
            }
            const isAdmin = req.user?.role === Role.ADMIN;

            const isPublic = (event as any).isPublic !== false;
            if (!isPublic && !isOwner && !isAdmin) {
                return res.status(403).json({ error: "Unauthorized access to private event" });
            }

            if (event.status !== EventStatus.APPROVED && !isOwner && !isAdmin) {
                return res.status(403).json({ error: "Unauthorized access to hidden event" });
            }

            res.json(event);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // --- Organizer Management ---

    static async createEvent(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            // Get organizer profile ID linked to user
            const organizer = await ProfileService.getOrganizerProfile(userId);

            const { categoryId, subCategoryId, cityId, dateTime, ...rest } = req.body;

            const event = await EventService.createEvent(organizer.id, {
                ...rest,
                dateTime: new Date(dateTime),
                categoryId: parseInt(String(categoryId), 10),
                subCategoryId: subCategoryId ? parseInt(String(subCategoryId), 10) : undefined,
                cityId: parseInt(String(cityId), 10)
            });

            res.status(201).json(event);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async updateEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const organizer = await ProfileService.getOrganizerProfile(userId);

            const event = await EventService.updateEvent(parseInt(id), organizer.id, req.body);
            res.json(event);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // --- Admin Actions ---

    static async listAllEvents(req: Request, res: Response) {
        try {
            const events = await EventService.adminListEvents();
            res.json(events);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async reviewEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, feeType, feeFixed, feePercentage, adminNote } = req.body;

            if (![EventStatus.APPROVED, EventStatus.REJECTED].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }

            const event = await EventService.reviewEvent(
                parseInt(id),
                status,
                feeType || "PERCENTAGE",
                feeFixed || 0,
                feePercentage || 0,
                adminNote
            );

            // Audit Log
            const { prisma } = await import("../lib/prisma");
            await prisma.notificationLog.create({
                data: {
                    userId: (req as any).user?.userId,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Event Reviewed',
                    content: `Admin ${(req as any).user?.userId} reviewed event ${id}: ${status}`,
                    status: 'DELIVERED',
                    metadata: { eventId: id, status, fees: { feeType, feeFixed, feePercentage } }
                }
            });

            res.json(event);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // --- Meta ---

    static async getMetadata(req: Request, res: Response) {
        try {
            const categories = await EventService.getCategories();
            const cities = await EventService.getCities();
            res.json({ categories, cities });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
