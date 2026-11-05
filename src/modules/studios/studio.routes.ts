import { Router } from 'express';
import * as controller from './studio.controller';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { validate, validateBody, validateQuery } from '../../middleware/validate';
import {
  createStudioSchema,
  updateStudioSchema,
  studioIdParamSchema,
  studioQuerySchema,
  featuredQuerySchema,
} from '../../validators/studio.validator';

const router = Router();

// Public routes first (order matters: specific before :id)
router.get('/featured', validate(featuredQuerySchema), controller.getFeatured);
router.get('/my-listings', authenticate, controller.getMyListings);
router.get('/', validate(studioQuerySchema), optionalAuth, controller.getStudios);
router.get('/:id', validate(studioIdParamSchema), controller.getStudioById);

// Protected
router.post(
  '/',
  authenticate,
  validateBody(createStudioSchema.shape.body),
  controller.createStudio
);

router.patch(
  '/:id',
  authenticate,
  validate(updateStudioSchema),
  controller.updateStudio
);

router.delete(
  '/:id',
  authenticate,
  validate(studioIdParamSchema),
  controller.deleteStudio
);

export default router;

