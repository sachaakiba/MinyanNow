import { Request, Response, NextFunction } from "express";
import { auth } from "../../lib/auth";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  };
}

export const userGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔐 UserGuard - Headers:", JSON.stringify(req.headers, null, 2));
    
    const session = await auth.api.getSession({
      headers: req.headers as unknown as HeadersInit,
    });

    console.log("🔐 UserGuard - Session result:", session ? "Found" : "Not found");

    if (!session || !session.user) {
      console.log("🔐 UserGuard - No session or user");
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to access this resource",
      });
    }

    console.log("🔐 UserGuard - User:", session.user.email);

    (req as AuthenticatedRequest).user = session.user as AuthenticatedRequest["user"];
    (req as AuthenticatedRequest).session = session.session as AuthenticatedRequest["session"];

    next();
  } catch (error) {
    console.error("🔐 Auth guard error:", error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired session",
    });
  }
};
