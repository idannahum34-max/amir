import "dotenv/config";
import { createApp } from "../dist/server/app.js";

const app = createApp({ serveClient: true });

export default app;
