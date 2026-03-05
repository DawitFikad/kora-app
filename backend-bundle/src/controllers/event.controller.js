"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const event_service_1 = require("../services/event.service");
const client_1 = require("@prisma/client");
const profile_service_1 = require("../services/profile.service");
class EventController {
    // --- Public Discovery ---
    static async getAllEvents(req, res) {
        try {
            const filters = req.query;
            const events = await event_service_1.EventService.listEvents(filters);
            res.json(events);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getEvent(req, res) {
        try {
            const { id } = req.params;
            const event = await event_service_1.EventService.getEventDetails(parseInt(id));
            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }
            // Only permit viewing if APPROVED or if requester is OWNER/ADMIN
            // Only permit viewing if APPROVED or if requester is OWNER/ADMIN
            let isOwner = false;
            if (req.user && req.user.role === client_1.Role.ORGANIZER) {
                try {
                    const organizer = await profile_service_1.ProfileService.getOrganizerProfile(req.user.userId);
                    isOwner = organizer.id === event.organizerId;
                }
                catch (e) {
                    isOwner = false;
                }
            }
            const isAdmin = req.user?.role === client_1.Role.ADMIN;
            const isPublic = event.isPublic !== false;
            if (!isPublic && !isOwner && !isAdmin) {
                return res.status(403).json({ error: "Unauthorized access to private event" });
            }
            if (event.status !== client_1.EventStatus.APPROVED && !isOwner && !isAdmin) {
                return res.status(403).json({ error: "Unauthorized access to hidden event" });
            }
            res.json(event);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // --- Organizer Management ---
    static async createEvent(req, res) {
        try {
            const userId = req.user.userId;
            // Get organizer profile ID linked to user
            const organizer = await profile_service_1.ProfileService.getOrganizerProfile(userId);
            const { categoryId, subCategoryId, cityId, dateTime, ...rest } = req.body;
            const event = await event_service_1.EventService.createEvent(organizer.id, {
                ...rest,
                dateTime: new Date(dateTime),
                categoryId: parseInt(String(categoryId), 10),
                subCategoryId: subCategoryId ? parseInt(String(subCategoryId), 10) : undefined,
                cityId: parseInt(String(cityId), 10)
            });
            res.status(201).json(event);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const organizer = await profile_service_1.ProfileService.getOrganizerProfile(userId);
            const event = await event_service_1.EventService.updateEvent(parseInt(id), organizer.id, req.body);
            res.json(event);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    // --- Admin Actions ---
    static async listAllEvents(req, res) {
        try {
            const events = await event_service_1.EventService.adminListEvents();
            res.json(events);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async reviewEvent(req, res) {
        try {
            const { id } = req.params;
            const { status, feeType, feeFixed, feePercentage, adminNote } = req.body;
            if (![client_1.EventStatus.APPROVED, client_1.EventStatus.REJECTED].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }
            const event = await event_service_1.EventService.reviewEvent(parseInt(id), status, feeType || "PERCENTAGE", feeFixed || 0, feePercentage || 0, adminNote);
            // Audit Log
            const { prisma } = await Promise.resolve().then(() => __importStar(require("../lib/prisma")));
            await prisma.notificationLog.create({
                data: {
                    userId: req.user?.userId,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Event Reviewed',
                    content: `Admin ${req.user?.userId} reviewed event ${id}: ${status}`,
                    status: 'DELIVERED',
                    metadata: { eventId: id, status, fees: { feeType, feeFixed, feePercentage } }
                }
            });
            res.json(event);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    // --- Meta ---
    static async getMetadata(req, res) {
        try {
            const categories = await event_service_1.EventService.getCategories();
            const cities = await event_service_1.EventService.getCities();
            res.json({ categories, cities });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.EventController = EventController;
