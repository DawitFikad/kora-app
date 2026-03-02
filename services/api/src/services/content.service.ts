import { prisma } from "../lib/prisma";

export class ContentService {
    static async listCategories() {
        const categories = await prisma.mainCategory.findMany({
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
        return prisma.mainCategory.findMany({
            include: {
                _count: { select: { events: true } }
            }
        });
    }

    static async listSubCategories(mainCategoryId?: number) {
        return prisma.subCategory.findMany({
            where: mainCategoryId ? { mainCategoryId } : undefined,
            include: {
                mainCategory: true,
                _count: { select: { events: true } }
            }
        });
    }

    static async listCities() {
        return prisma.city.findMany({
            include: {
                _count: { select: { events: true } }
            }
        });
    }

    static async createCategory(name: string, slug: string, mainCategoryId?: number) {
        if (mainCategoryId) {
            return prisma.subCategory.create({
                data: { name, slug, mainCategoryId }
            });
        }
        return prisma.mainCategory.create({
            data: { name, slug }
        });
    }

    static async createCity(name: string, slug: string) {
        return prisma.city.create({
            data: { name, slug }
        });
    }

    static async deleteCategory(id: number) {
        // Since we don't know if id is main or sub just from `id` if they are disjoint, 
        // wait, we can try to delete from main first, if not found then from sub.
        try {
            return await prisma.mainCategory.delete({ where: { id } });
        } catch {
            return await prisma.subCategory.delete({ where: { id } });
        }
    }

    static async deleteCity(id: number) {
        return prisma.city.delete({
            where: { id }
        });
    }

    static async getCategoryDetails(id: number) {
        try {
            const main = await prisma.mainCategory.findUnique({
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
            if (main) return main;

            return await prisma.subCategory.findUnique({
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
        } catch (e) {
            throw e;
        }
    }

    static async getCityDetails(id: number) {
        return prisma.city.findUnique({
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
        return prisma.homepageBanner.findMany({
            orderBy: [
                { priority: 'desc' },
                { order: 'asc' }
            ]
        });
    }

    static async listActiveBanners() {
        return prisma.homepageBanner.findMany({
            where: {
                isActive: true
            },
            orderBy: [
                { priority: 'desc' },
                { order: 'asc' }
            ]
        });
    }

    static async getBannerById(id: number) {
        return prisma.homepageBanner.findUnique({
            where: { id }
        });
    }

    static async createBanner(data: any) {
        return prisma.homepageBanner.create({
            data
        });
    }

    static async updateBanner(id: number, data: any) {
        return prisma.homepageBanner.update({
            where: { id },
            data
        });
    }

    static async deleteBanner(id: number) {
        return prisma.homepageBanner.delete({
            where: { id }
        });
    }

    static async incrementBannerView(id: number) {
        return prisma.homepageBanner.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        });
    }

    static async incrementBannerClick(id: number) {
        return prisma.homepageBanner.update({
            where: { id },
            data: { clickCount: { increment: 1 } }
        });
    }
}
