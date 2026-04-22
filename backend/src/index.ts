import "dotenv/config";
import "./config/env.ts";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import prisma from "./config/prisma.ts";
import {
  generalLimiter,
  authLimiter,
} from "./middleware/rateLimit.middleware.ts";
import { globalErrorHandler } from "./middleware/errorHandler.middleware.ts";

import authRouter from "./routes/auth.routes.ts";
import pharmacyRouter from "./routes/pharmacy.routes.ts";
import adminRouter from "./routes/admin.routes.ts";
import medicineRouter from "./routes/medicine.routes.ts";
import inventoryRouter from "./routes/inventory.routes.ts";
import orderRouter from "./routes/order.routes.ts";
import storeRouter from "./routes/store.routes.ts";
import addressRouter from "./routes/address.routes.ts";
import consumerRouter from "./routes/consumer.routes.ts";
import notificationRouter from "./routes/notification.routes.ts";
import documentRouter from "./routes/document.routes.ts";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(generalLimiter);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "MedMarket API",
    version: "1.0.0",
  });
});

app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/pharmacy/inventory", inventoryRouter);
app.use("/api/v1/pharmacy/documents", documentRouter);
app.use("/api/v1/pharmacy", pharmacyRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/medicines", medicineRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/stores", storeRouter);
app.use("/api/v1/consumer/addresses", addressRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/consumer", consumerRouter);

// ── Global error handler — must be registered LAST ──
app.use(globalErrorHandler);

async function main() {
  await prisma.$connect();
  console.log("✅ Database connected");
  app.listen(PORT, () =>
    console.log(`🚀 MedMarket API running on port ${PORT}`),
  );
}

main();
