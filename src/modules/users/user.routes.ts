import { Router } from 'express';
import { getMe, updateMe } from './user.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { updateMeSchema } from '../../validators/user.validator';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', validateBody(updateMeSchema.shape.body), updateMe);

export default router;

