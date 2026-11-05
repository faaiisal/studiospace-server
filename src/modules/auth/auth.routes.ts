import { Router } from 'express';
import { register, login, logout, me, googleAuth, googleCallback } from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { registerSchema, loginSchema } from '../../validators/auth.validator';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', validateBody(registerSchema.shape.body), register);
router.post('/login', validateBody(loginSchema.shape.body), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;

