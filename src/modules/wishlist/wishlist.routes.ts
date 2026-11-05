import { Router } from 'express';
import * as controller from './wishlist.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createWishlistSchema, wishlistIdParamSchema } from '../../validators/wishlist.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createWishlistSchema), controller.addToWishlist);
router.get('/', controller.getWishlist);
router.delete('/:id', validate(wishlistIdParamSchema), controller.removeFromWishlist);

export default router;

