import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { EmailService } from "./services/email.service";

EmailService.initialize();

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0'; // Bind to all network interfaces to allow Android emulator access

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Physical devices: use 'adb reverse tcp:4000 tcp:4000' and connect to http://localhost:${PORT}`);
});
