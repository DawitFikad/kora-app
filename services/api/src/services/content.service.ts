import { prisma } from "../lib/prisma";

export class ContentService {
    static async listCategories() {
        return prisma.category.findMany({
            include: {
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

    static async createCategory(name: string, slug: string) {
        return prisma.category.create({
            data: { name, slug }
        });
    }

    static async createCity(name: string, slug: string) {
        return prisma.city.create({
            data: { name, slug }
        });
    }

    static async deleteCategory(id: number) {
        return prisma.category.delete({
            where: { id }
        });
    }

    static async deleteCity(id: number) {
        return prisma.city.delete({
            where: { id }
        });
    }

    static async getCategoryDetails(id: number) {
        return prisma.category.findUnique({
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
}
