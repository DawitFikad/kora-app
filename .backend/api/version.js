"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (req, res) => {
    res.status(200).json({
        message: "Direct Serverless Function Working",
        timestamp: new Date().toISOString(),
        version: "3.4.0-DIRECT"
    });
};
