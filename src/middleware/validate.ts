import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Replace with validated data (strip unknown)
      req.body = (parsed as any).body || req.body;
      req.query = (parsed as any).query || req.query;
      req.params = (parsed as any).params || req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: {
            details: err.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(err);
    }
  };
};

// For validating only body, query, or params separately
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: {
            details: err.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(err);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: {
            details: err.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(err);
    }
  };
};

