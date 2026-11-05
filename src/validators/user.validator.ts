import { z } from 'zod';

export const updateMeSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, 'Name min 2 chars')
        .max(50, 'Name max 50 chars')
        .trim()
        .optional(),
      photoURL: z.string().url('Invalid URL').optional(),
    })
    .strict(), // no mass assignment
});

