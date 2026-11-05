import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBookingSchema = z.object({
  body: z.object({
    studio: z.string().regex(objectIdRegex, 'Invalid studio ID'),
    bookingDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    startTime: z.string().min(1, 'Start time required'),
    endTime: z.string().min(1, 'End time required'),
    crewSize: z.number().int().min(1).max(500).optional(),
    productionType: z.string().max(100).trim().optional(),
    notes: z.string().max(1000).trim().optional(),
  }),
});

export const bookingIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid booking ID'),
  }),
});

export const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid booking ID'),
  }),
  body: z.object({
    status: z.enum(['confirmed', 'rejected', 'completed'], {
      message: 'Status must be confirmed, rejected, or completed',
    }),
  }),
});

export const bookingQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'all'])
      .optional()
      .default('all'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    sort: z.enum(['newest', 'date-asc']).optional().default('newest'),
    studioId: z.string().regex(objectIdRegex).optional(),
  }),
});

export const cancelBookingBodySchema = z.object({
  body: z.object({
    reason: z.string().max(500).trim().optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid booking ID'),
  }),
});

