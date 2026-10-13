import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/store.ts";
import { signToken, AuthenticatedRequest, requireAuth } from "../middleware/auth.ts";
import { validateBody } from "../middleware/validate.ts";
import { registerSchema, loginSchema } from "../../shared/schemas.ts";

export const authRouter = Router();

// Register
authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  try {
    const { email, password, name, role, organisation, skills, location, preferred_language } = req.body;

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "An account with this email address already exists.",
        },
      });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const newUser = db.createUser({
      name,
      email,
      password_hash,
      role,
      organisation: organisation || "",
      skills: skills || [],
      location: location || "",
      preferred_language: preferred_language || "en",
    });

    const token = signToken(newUser);
    res.cookie("civicbridge_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password_hash: _, ...safeUser } = newUser;
    return res.status(201).json({ user: safeUser, token });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// Login
authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Incorrect email or password.",
        },
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Incorrect email or password.",
        },
      });
    }

    const token = signToken(user);
    res.cookie("civicbridge_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password_hash: _, ...safeUser } = user;
    return res.json({ user: safeUser, token });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// Logout
authRouter.post("/logout", (req, res) => {
  res.clearCookie("civicbridge_token");
  return res.json({ success: true });
});

// Current User
authRouter.get("/me", (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  const { password_hash: _, ...safeUser } = req.user;
  return res.json({ user: safeUser });
});

// Quick Demo Role Switcher (for seamless testing of all 6 roles!)
authRouter.post("/demo-switch", (req, res) => {
  const { role, email } = req.body;
  let targetUser = email ? db.getUserByEmail(email) : undefined;

  if (!targetUser && role) {
    for (const u of db.getAllUsers()) {
      if (u.role === role) {
        targetUser = u;
        break;
      }
    }
  }

  if (!targetUser) {
    return res.status(404).json({
      error: { code: "USER_NOT_FOUND", message: "Demo user not found." },
    });
  }

  const token = signToken(targetUser);
  res.cookie("civicbridge_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { password_hash: _, ...safeUser } = targetUser;
  return res.json({ user: safeUser, token });
});
