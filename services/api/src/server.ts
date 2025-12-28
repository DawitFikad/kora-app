import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { EmailService } from "./services/email.service";

EmailService.initialize();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
