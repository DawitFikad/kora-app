import { Request, Response } from "express";
import { SavedPaymentService } from "../services/saved-payment.service";

export class SavedPaymentController {
    static async getMyMethods(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const methods = await SavedPaymentService.listMethods(userId);
            res.json(methods);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async addMethod(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const method = await SavedPaymentService.addMethod(userId, req.body);
            res.status(201).json(method);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteMethod(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { id } = req.params;
            await SavedPaymentService.deleteMethod(userId, parseInt(id));
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async setDefault(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { id } = req.params;
            await SavedPaymentService.setDefault(userId, parseInt(id));
            res.json({ message: "Default payment method updated" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
