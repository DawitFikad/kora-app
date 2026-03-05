"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedPaymentController = void 0;
const saved_payment_service_1 = require("../services/saved-payment.service");
class SavedPaymentController {
    static async getMyMethods(req, res) {
        try {
            const userId = req.user.userId;
            const methods = await saved_payment_service_1.SavedPaymentService.listMethods(userId);
            res.json(methods);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async addMethod(req, res) {
        try {
            const userId = req.user.userId;
            const method = await saved_payment_service_1.SavedPaymentService.addMethod(userId, req.body);
            res.status(201).json(method);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteMethod(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            await saved_payment_service_1.SavedPaymentService.deleteMethod(userId, parseInt(id));
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async setDefault(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            await saved_payment_service_1.SavedPaymentService.setDefault(userId, parseInt(id));
            res.json({ message: "Default payment method updated" });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.SavedPaymentController = SavedPaymentController;
