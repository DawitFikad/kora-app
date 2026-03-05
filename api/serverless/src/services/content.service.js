"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const prisma_1 = require("../lib/prisma");
class ContentService {
    static async listCategories() {
        const categories = await prisma_1.prisma.mainCategory.findMany({
            include: {
                subCategories: true,
                _count: { select: { events: true } }
            }
        });
        // Map subCategories to subcategories for frontend compatibility
        return categories.map(c => ({
            ...c,
            subcategories: c.subCategories
        }));
    }
    static async listMainCategories() {
        return prisma_1.prisma.mainCategory.findMany({
            include: {
                _count: { select: { events: true } }
            }
        });
    }
    static async listSubCategories(mainCategoryId) {
        return prisma_1.prisma.subCategory.findMany({
            where: mainCategoryId ? { mainCategoryId } : undefined,
            include: {
                mainCategory: true,
                _count: { select: { events: true } }
            }
        });
    }
    static async listCities() {
        return prisma_1.prisma.city.findMany({
            include: {
                _count: { select: { events: true } }
            }
        });
    }
    static async createCategory(name, slug, mainCategoryId) {
        if (mainCategoryId) {
            return prisma_1.prisma.subCategory.create({
                data: { name, slug, mainCategoryId }
            });
        }
        return prisma_1.prisma.mainCategory.create({
            data: { name, slug }
        });
    }
    static async createCity(name, slug) {
        return prisma_1.prisma.city.create({
            data: { name, slug }
        });
    }
    static async deleteCategory(id) {
        // Since we don't know if id is main or sub just from `id` if they are disjoint, 
        // wait, we can try to delete from main first, if not found then from sub.
        try {
            return await prisma_1.prisma.mainCategory.delete({ where: { id } });
        }
        catch {
            return await prisma_1.prisma.subCategory.delete({ where: { id } });
        }
    }
    static async deleteCity(id) {
        return prisma_1.prisma.city.delete({
            where: { id }
        });
    }
    static async getCategoryDetails(id) {
        try {
            const main = await prisma_1.prisma.mainCategory.findUnique({
                where: { id },
                include: {
                    events: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            dateTime: true,
                            venue: true,
                            organizer: { select: { organizationName: true } }
                        }
                    }
                }
            });
            if (main)
                return main;
            return await prisma_1.prisma.subCategory.findUnique({
                where: { id },
                include: {
                    events: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            dateTime: true,
                            venue: true,
                            organizer: { select: { organizationName: true } }
                        }
                    }
                }
            });
        }
        catch (e) {
            throw e;
        }
    }
    static async getCityDetails(id) {
        return prisma_1.prisma.city.findUnique({
            where: { id },
            include: {
                events: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        dateTime: true,
                        venue: true,
                        organizer: { select: { organizationName: true } }
                    }
                }
            }
        });
    }
    static async listBanners() {
        return prisma_1.prisma.homepageBanner.findMany({
            orderBy: [
                { priority: 'desc' },
                { order: 'asc' }
            ]
        });
    }
    static async listActiveBanners() {
        return prisma_1.prisma.homepageBanner.findMany({
            where: {
                isActive: true
            },
            orderBy: [
                { priority: 'desc' },
                { order: 'asc' }
            ]
        });
    }
    static async getBannerById(id) {
        return prisma_1.prisma.homepageBanner.findUnique({
            where: { id }
        });
    }
    static async createBanner(data) {
        return prisma_1.prisma.homepageBanner.create({
            data
        });
    }
    static async updateBanner(id, data) {
        return prisma_1.prisma.homepageBanner.update({
            where: { id },
            data
        });
    }
    static async deleteBanner(id) {
        return prisma_1.prisma.homepageBanner.delete({
            where: { id }
        });
    }
    static async incrementBannerView(id) {
        return prisma_1.prisma.homepageBanner.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        });
    }
    static async incrementBannerClick(id) {
        return prisma_1.prisma.homepageBanner.update({
            where: { id },
            data: { clickCount: { increment: 1 } }
        });
    }
}
exports.ContentService = ContentService;
