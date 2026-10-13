import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of err.issues) {
          const path = issue.path.join(".");
          fields[path || "root"] = issue.message;
        }
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Request data failed validation.",
            fields,
          },
        });
      }
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid input payload.",
        },
      });
    }
  };
}
