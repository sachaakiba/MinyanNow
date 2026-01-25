import { Request, Response, NextFunction } from "express";
import { auth } from "../../lib/auth";
import prisma from "../../lib/prisma";

export interface AdminRequest extends Request {
  admin: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Middleware to protect admin routes
 * Verifies that the user is authenticated AND has SUPER_ADMIN role
 */
export const adminGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔐 AdminGuard - Checking session...");
    
    // Get session from better-auth (same method as userGuard)
    const session = await auth.api.getSession({
      headers: req.headers as unknown as HeadersInit,
    });

    console.log("🔐 AdminGuard - Session result:", session ? "Found" : "Not found");

    if (!session || !session.user) {
      console.log("🔐 AdminGuard - No session or user");
      return res.status(401).json({ 
        error: "Unauthorized - No session",
        message: "You must be logged in to access this resource",
      });
    }

    console.log("🔐 AdminGuard - User:", session.user.email);

    // Check if user has SUPER_ADMIN role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.log("🔐 AdminGuard - User not found in database");
      return res.status(401).json({ 
        error: "Unauthorized - User not found",
        message: "User account not found",
      });
    }

    console.log("🔐 AdminGuard - User role:", user.role);

    if (user.role !== "SUPER_ADMIN") {
      console.log("🔐 AdminGuard - User is not SUPER_ADMIN");
      return res.status(403).json({ 
        error: "Forbidden - Admin access required",
        message: "This resource requires administrator privileges",
      });
    }

    console.log("🔐 AdminGuard - Access granted for SUPER_ADMIN");

    // Attach admin info to request
    (req as AdminRequest).admin = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    console.error("🔐 Admin guard error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: "An error occurred while checking permissions",
    });
  }
};
