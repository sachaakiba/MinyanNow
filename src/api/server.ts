import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";
import eventsRouter from "./routes/events";
import requestsRouter from "./routes/requests";
import usersRouter from "./routes/users";
import "dotenv/config";
import prisma from "../lib/prisma";

const app = express();
const PORT = process.env.PORT || 3000;

console.log("🔧 Environment check:");
console.log(`  - PORT: ${PORT}`);
console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  - BETTER_AUTH_SECRET: ${process.env.BETTER_AUTH_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`  - BETTER_AUTH_URL: ${process.env.BETTER_AUTH_URL || '❌ Missing'}`);
console.log(`  - SMS Mode: ${process.env.NODE_ENV === 'development' ? '📝 Console only (no Twilio)' : '📱 Twilio enabled'}`);
console.log(`  - DB USED: ${process.env.DATABASE_URL}`);
// Test database connection on startup
async function startServer() {
  try {
    console.log("🔍 Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Start the server after DB is ready
    const server = app.listen(PORT, "0.0.0.0", () => {
      const apiUrl = process.env.BETTER_AUTH_URL || `http://localhost:${PORT}`;
      console.log(`\n✅ Server successfully started!`);
      console.log(`🚀 Listening on 0.0.0.0:${PORT}`);
      console.log(`🌐 Public URL: ${apiUrl}`);
      console.log(`📝 Auth endpoints: ${apiUrl}/api/auth/*`);
      console.log(`📅 Events API: ${apiUrl}/api/events`);
      console.log(`🙋 Requests API: ${apiUrl}/api/requests`);
      console.log(`💚 Health check: ${apiUrl}/health`);
    });

    server.on('error', (error: any) => {
      console.error('❌ Server failed to start:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

startServer();

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
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      env: {
        hasAuthSecret: !!process.env.BETTER_AUTH_SECRET,
        hasAuthUrl: !!process.env.BETTER_AUTH_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        authUrl: process.env.BETTER_AUTH_URL,
      }
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default app;
