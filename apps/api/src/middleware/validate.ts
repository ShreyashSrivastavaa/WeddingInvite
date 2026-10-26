import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.') || 'root';
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(err.message);
      });

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.errors[0]?.message || 'Invalid request body',
          fieldErrors,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.errors[0]?.message || 'Invalid query parameters',
        },
      });
      return;
    }
    req.query = result.data as Record<string, any>;
    next();
  };
}
