import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";
import eventsRouter from "./routes/events";
import requestsRouter from "./routes/requests";
import usersRouter from "./routes/users";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow all origins for development
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Better Auth handler - must be before express.json() for multipart support
app.all("/api/auth/*splat", toNodeHandler(auth));

// JSON parser for other routes - increased limit for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Routes
app.use("/api/events", eventsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/users", usersRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || `http://localhost:${PORT}`;
  console.log(`🚀 Server running on ${apiUrl}`);
  console.log(`📝 Auth endpoints available at ${apiUrl}/api/auth/*`);
  console.log(`📅 Events API: ${apiUrl}/api/events`);
  console.log(`🙋 Requests API: ${apiUrl}/api/requests`);
  console.log(`\n📱 For mobile testing, use your local IP address or EXPO_PUBLIC_API_URL from .env`);
});

export default app;
