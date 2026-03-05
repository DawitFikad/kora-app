"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const content_service_1 = require("../services/content.service");
class ContentController {
    static async getCategories(req, res) {
        try {
            const categories = await content_service_1.ContentService.listCategories();
            res.json({ success: true, data: categories });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getMainCategories(req, res) {
        try {
            const categories = await content_service_1.ContentService.listMainCategories();
            res.json({ success: true, data: categories });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getSubCategories(req, res) {
        try {
            const { parentId } = req.query;
            let pId;
            if (parentId) {
                pId = parseInt(parentId);
                if (isNaN(pId)) {
                    // If invalid ID provided, return error
                    res.status(400).json({ success: false, message: "Invalid parentId" });
                    return;
                }
            }
            const subCategories = await content_service_1.ContentService.listSubCategories(pId);
            res.json({ success: true, data: subCategories });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getCities(req, res) {
        try {
            const cities = await content_service_1.ContentService.listCities();
            res.json({ success: true, data: cities });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async addCategory(req, res) {
        try {
            const { name, slug, mainCategoryId } = req.body;
            const category = await content_service_1.ContentService.createCategory(name, slug, mainCategoryId);
            res.json(category);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async addCity(req, res) {
        try {
            const { name, slug } = req.body;
            const city = await content_service_1.ContentService.createCity(name, slug);
            res.json(city);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async removeCategory(req, res) {
        try {
            const { id } = req.params;
            await content_service_1.ContentService.deleteCategory(parseInt(id));
            res.json({ message: "Category deleted" });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async removeCity(req, res) {
        try {
            const { id } = req.params;
            await content_service_1.ContentService.deleteCity(parseInt(id));
            res.json({ message: "City deleted" });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getCategoryDetail(req, res) {
        try {
            const { id } = req.params;
            const detail = await content_service_1.ContentService.getCategoryDetails(parseInt(id));
            res.json({ success: true, data: detail });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getCityDetail(req, res) {
        try {
            const { id } = req.params;
            const detail = await content_service_1.ContentService.getCityDetails(parseInt(id));
            res.json({ success: true, data: detail });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getBanners(req, res) {
        try {
            const { admin } = req.query;
            let banners;
            if (admin === 'true') {
                banners = await content_service_1.ContentService.listBanners();
            }
            else {
                banners = await content_service_1.ContentService.listActiveBanners();
            }
            res.json({ success: true, data: banners });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getBannerDetail(req, res) {
        try {
            const { id } = req.params;
            const banner = await content_service_1.ContentService.getBannerById(parseInt(id));
            if (!banner) {
                return res.status(404).json({ success: false, message: "Banner not found" });
            }
            res.json({ success: true, data: banner });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async addBanner(req, res) {
        try {
            console.log('Adding Banner Payload:', req.body);
            const data = { ...req.body };
            if (data.startDate)
                data.startDate = new Date(data.startDate);
            if (data.endDate)
                data.endDate = new Date(data.endDate);
            const banner = await content_service_1.ContentService.createBanner(data);
            res.json({ success: true, data: banner });
        }
        catch (error) {
            console.error('Add Banner Error:', error);
            res.status(400).json({ error: error.message });
        }
    }
    static async updateBanner(req, res) {
        try {
            const { id } = req.params;
            console.log(`Updating Banner ${id} Payload:`, req.body);
            const data = { ...req.body };
            if (data.startDate)
                data.startDate = new Date(data.startDate);
            if (data.endDate)
                data.endDate = new Date(data.endDate);
            const banner = await content_service_1.ContentService.updateBanner(parseInt(id), data);
            res.json({ success: true, data: banner });
        }
        catch (error) {
            console.error('Update Banner Error:', error);
            res.status(400).json({ error: error.message });
        }
    }
    static async removeBanner(req, res) {
        try {
            const { id } = req.params;
            await content_service_1.ContentService.deleteBanner(parseInt(id));
            res.json({ success: true, message: "Banner deleted" });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async trackBannerView(req, res) {
        try {
            const { id } = req.params;
            await content_service_1.ContentService.incrementBannerView(parseInt(id));
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async trackBannerClick(req, res) {
        try {
            const { id } = req.params;
            await content_service_1.ContentService.incrementBannerClick(parseInt(id));
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.ContentController = ContentController;
