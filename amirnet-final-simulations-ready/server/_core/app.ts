import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite-static";
import { handleLemonSqueezyWebhook } from "./billingWebhook";

export function createApp(options: { serveClient?: boolean } = {}) {
  const app = express();

  app.set("trust proxy", true);
  app.post("/api/billing/webhook", express.raw({ type: "application/json", limit: "2mb" }), handleLemonSqueezyWebhook);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (options.serveClient) {
    serveStatic(app);
  }

  return app;
}
