import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name max 50 chars')
      .trim(),
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: z
      .string()
      .min(6, 'Password min 6 characters')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase and one lowercase letter'
      ),
    photoURL: z.string().url('Invalid photo URL').optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];

