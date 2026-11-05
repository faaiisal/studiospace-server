import { Router } from 'express';
import * as controller from './booking.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createBookingSchema,
  bookingIdParamSchema,
  updateBookingStatusSchema,
  bookingQuerySchema,
  cancelBookingBodySchema,
} from '../../validators/booking.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createBookingSchema), controller.createBooking);
router.get('/my-bookings', validate(bookingQuerySchema), controller.getMyBookings);
router.get('/host-bookings', validate(bookingQuerySchema), controller.getHostBookings);
router.get('/:id', validate(bookingIdParamSchema), controller.getBookingById);
router.patch('/:id/status', validate(updateBookingStatusSchema), controller.updateStatus);
router.patch('/:id/cancel', validate(cancelBookingBodySchema), controller.cancelBooking);

export default router;

