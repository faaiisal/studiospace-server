import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createWishlistSchema = z.object({
  body: z.object({
    studio: z.string().regex(objectIdRegex, 'Invalid studio ID'),
  }),
});

export const wishlistIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid wishlist ID'),
  }),
});

