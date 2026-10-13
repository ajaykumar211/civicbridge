import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, DBUser } from "../db/store.ts";

const JWT_SECRET = process.env.JWT_SECRET || "civicbridge_development_super_secret_key_change_in_production";

export interface AuthenticatedRequest extends Request {
  user?: DBUser;
  userId?: string;
  userRole?: string;
}

export function signToken(user: DBUser): string {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Read token from cookie or Authorization header
  let token = req.cookies?.civicbridge_token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      name: string;
      email: string;
    };
    const user = db.getUserById(decoded.userId);
    if (user) {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
    }
  } catch (err) {
    // Expired or invalid token, clear user
    req.user = undefined;
    req.userId = undefined;
    req.userRole = undefined;
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.userId) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "You must be signed in to perform this action.",
      },
    });
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `This action requires one of the following roles: ${allowedRoles.join(", ")}. Your role is: ${req.user.role}.`,
        },
      });
    }

    next();
  };
}

export function requireVerifier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.userId) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required." },
    });
  }

  if (!req.user.can_verify && req.user.role !== "admin") {
    return res.status(403).json({
      error: {
        code: "VERIFIER_PERMISSION_REQUIRED",
        message: "On-site verification requires can_verify credentials granted by a platform administrator.",
      },
    });
  }

  next();
}
