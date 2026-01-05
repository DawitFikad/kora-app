import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { EmailService } from "./services/email.service";

EmailService.initialize();

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0'; // Bind to all network interfaces to allow Android emulator access

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Accessible from Android emulator at http://10.0.2.2:${PORT}`);
});
