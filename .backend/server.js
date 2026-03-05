"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const email_service_1 = require("./services/email.service");
email_service_1.EmailService.initialize();
const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0';
app_1.default.listen(PORT, HOST, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Physical devices: use 'adb reverse tcp:4000 tcp:4000' and connect to http://localhost:${PORT}`);
});
