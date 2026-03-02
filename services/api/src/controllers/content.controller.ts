import { Request, Response } from "express";
import { ContentService } from "../services/content.service";

export class ContentController {
    static async getCategories(req: Request, res: Response) {
        try {
            const categories = await ContentService.listCategories();
            res.json({ success: true, data: categories });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getMainCategories(req: Request, res: Response) {
        try {
            const categories = await ContentService.listMainCategories();
            res.json({ success: true, data: categories });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getSubCategories(req: Request, res: Response) {
        try {
            const { parentId } = req.query;
            let pId: number | undefined;
            if (parentId) {
                pId = parseInt(parentId as string);
                if (isNaN(pId)) {
                    // If invalid ID provided, return error
                    res.status(400).json({ success: false, message: "Invalid parentId" });
                    return;
                }
            }
            const subCategories = await ContentService.listSubCategories(pId);
            res.json({ success: true, data: subCategories });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getCities(req: Request, res: Response) {
        try {
            const cities = await ContentService.listCities();
            res.json({ success: true, data: cities });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async addCategory(req: Request, res: Response) {
        try {
            const { name, slug, mainCategoryId } = req.body;
            const category = await ContentService.createCategory(name, slug, mainCategoryId);
            res.json(category);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async addCity(req: Request, res: Response) {
        try {
            const { name, slug } = req.body;
            const city = await ContentService.createCity(name, slug);
            res.json(city);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async removeCategory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await ContentService.deleteCategory(parseInt(id));
            res.json({ message: "Category deleted" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async removeCity(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await ContentService.deleteCity(parseInt(id));
            res.json({ message: "City deleted" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getCategoryDetail(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const detail = await ContentService.getCategoryDetails(parseInt(id));
            res.json({ success: true, data: detail });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getCityDetail(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const detail = await ContentService.getCityDetails(parseInt(id));
            res.json({ success: true, data: detail });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getBanners(req: Request, res: Response) {
        try {
            const { admin } = req.query;
            let banners;
            if (admin === 'true') {
                banners = await ContentService.listBanners();
            } else {
                banners = await ContentService.listActiveBanners();
            }
            res.json({ success: true, data: banners });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getBannerDetail(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const banner = await ContentService.getBannerById(parseInt(id));
            if (!banner) {
                return res.status(404).json({ success: false, message: "Banner not found" });
            }
            res.json({ success: true, data: banner });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async addBanner(req: Request, res: Response) {
        try {
            console.log('Adding Banner Payload:', req.body);
            const data = { ...req.body };

            if (data.startDate) data.startDate = new Date(data.startDate);
            if (data.endDate) data.endDate = new Date(data.endDate);

            const banner = await ContentService.createBanner(data);
            res.json({ success: true, data: banner });
        } catch (error: any) {
            console.error('Add Banner Error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async updateBanner(req: Request, res: Response) {
        try {
            const { id } = req.params;
            console.log(`Updating Banner ${id} Payload:`, req.body);
            const data = { ...req.body };

            if (data.startDate) data.startDate = new Date(data.startDate);
            if (data.endDate) data.endDate = new Date(data.endDate);

            const banner = await ContentService.updateBanner(parseInt(id), data);
            res.json({ success: true, data: banner });
        } catch (error: any) {
            console.error('Update Banner Error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async removeBanner(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await ContentService.deleteBanner(parseInt(id));
            res.json({ success: true, message: "Banner deleted" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async trackBannerView(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await ContentService.incrementBannerView(parseInt(id));
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async trackBannerClick(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await ContentService.incrementBannerClick(parseInt(id));
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
