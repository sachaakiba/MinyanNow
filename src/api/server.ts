import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";
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

// JSON parser for other routes
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Auth endpoints available at http://localhost:${PORT}/api/auth/*`);
  console.log(`\n📱 For mobile testing, use your local IP address`);
});

export default app;
