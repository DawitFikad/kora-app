import { Request, Response } from "express";
import { ContentService } from "../services/content.service";

export class ContentController {
    static async getCategories(req: Request, res: Response) {
        try {
            const categories = await ContentService.listCategories();
            res.json(categories);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getCities(req: Request, res: Response) {
        try {
            const cities = await ContentService.listCities();
            res.json(cities);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async addCategory(req: Request, res: Response) {
        try {
            const { name, slug } = req.body;
            const category = await ContentService.createCategory(name, slug);
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
}
