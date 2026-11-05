import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createStudioSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title min 3').max(100, 'Title max 100').trim(),
    category: z.string().min(2, 'Category min 2').trim().toLowerCase(),
    description: z.string().min(20, 'Description min 20').max(5000, 'Description max 5000'),
    hourlyRate: z.number().min(10, 'Min $10').max(10000, 'Max $10000'),
    securityDeposit: z.number().min(0).max(100000),
    maxCapacity: z.number().int().min(1, 'Min 1').max(500, 'Max 500'),
    location: z.string().min(3, 'Location min 3').max(200, 'Location max 200').trim(),
    images: z
      .array(z.string().url('Invalid image URL'))
      .min(1, 'At least 1 image')
      .max(10, 'Max 10 images'),
    amenities: z.array(z.string().min(1)).min(1, 'At least 1 amenity'),
    squareFootage: z.number().min(0).optional(),
    ceilingHeight: z.number().min(0).optional(),
    powerAmperage: z.enum(['100', '200', '400']).or(z.literal(100)).or(z.literal(200)).or(z.literal(400)).optional().transform((val) => (val ? Number(val) : undefined)),
    stcRating: z.number().min(0).max(100).optional(),
  }),
});

export const updateStudioSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid studio ID'),
  }),
  body: z
    .object({
      title: z.string().min(3).max(100).trim().optional(),
      category: z.string().min(2).trim().toLowerCase().optional(),
      description: z.string().min(20).max(5000).optional(),
      hourlyRate: z.number().min(10).max(10000).optional(),
      securityDeposit: z.number().min(0).max(100000).optional(),
      maxCapacity: z.number().int().min(1).max(500).optional(),
      location: z.string().min(3).max(200).trim().optional(),
      images: z.array(z.string().url()).min(1).max(10).optional(),
      amenities: z.array(z.string().min(1)).min(1).optional(),
      squareFootage: z.number().min(0).optional(),
      ceilingHeight: z.number().min(0).optional(),
      powerAmperage: z.number().optional(),
      stcRating: z.number().min(0).max(100).optional(),
      isActive: z.boolean().optional(),
    })
    .strict(),
});

export const studioIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid studio ID'),
  }),
});

export const studioQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().optional(),
    category: z.string().trim().optional(),
    location: z.string().trim().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    amenities: z.string().optional(),
    sort: z
      .enum(['newest', 'price-asc', 'price-desc', 'rating-desc', 'capacity-desc', 'size-desc'])
      .optional()
      .default('newest'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(12),
    squareFootage: z.coerce.number().optional(),
    ceilingHeight: z.coerce.number().optional(),
  }),
});

export const featuredQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(12).optional().default(6),
  }),
});

