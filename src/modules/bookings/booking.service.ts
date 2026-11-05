import mongoose from 'mongoose';
import Booking from './booking.model';
import Studio from '../studios/studio.model';
import { createError } from '../../middleware/errorHandler';
import {
  parseTimeToMinutes,
  calculateDuration,
  calculateBookingPrice,
  isValidFutureDate,
  isOverlapping,
} from '../../utils/booking';

interface CreateBookingInput {
  studio: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  crewSize?: number;
  productionType?: string;
  notes?: string;
}

export const createBooking = async (userId: string, data: CreateBookingInput) => {
  const { studio: studioId, bookingDate, startTime, endTime } = data;

  if (!isValidFutureDate(bookingDate)) {
    throw createError('Booking date must be today or future, format YYYY-MM-DD', 400);
  }

  let startMinutes: number;
  let endMinutes: number;
  try {
    startMinutes = parseTimeToMinutes(startTime);
    endMinutes = parseTimeToMinutes(endTime);
  } catch (err: any) {
    throw createError(err.message, 400);
  }

  if (startMinutes >= endMinutes) {
    throw createError('Start time must be earlier than end time', 400);
  }

  const durationCalc = calculateDuration(startMinutes, endMinutes);
  if (durationCalc.durationHours < 1) {
    throw createError('Minimum booking duration is 1 hour', 400);
  }

  const studio = await Studio.findById(studioId);
  if (!studio) throw createError('Studio not found', 404);
  if (!studio.isActive) throw createError('Studio is not active', 400);

  if (studio.owner.toString() === userId) {
    throw createError('Cannot book your own studio', 403);
  }

  const price = calculateBookingPrice(
    studio.hourlyRate,
    durationCalc.durationHours,
    studio.securityDeposit
  );

  const session = await mongoose.startSession();

  try {
    let bookingResult: any = null;

    await session.withTransaction(async () => {
      const overlapping = await Booking.find({
        studio: studioId,
        bookingDate,
        status: { $in: ['pending', 'confirmed'] },
        startMinutes: { $lt: endMinutes },
        endMinutes: { $gt: startMinutes },
      } as any).session(session) as any[];

      const hasConflict = overlapping.some((b: any) =>
        isOverlapping(startMinutes, endMinutes, b.startMinutes, b.endMinutes)
      );

      if (hasConflict || overlapping.length > 0) {
        throw createError('Booking conflict: Time slot already booked', 409);
      }

      const bookingDocs = await Booking.create(
        [
          {
            studio: studioId,
            user: userId,
            host: studio.owner,
            bookingDate,
            startTime,
            endTime,
            startMinutes,
            endMinutes,
            duration: price.duration,
            hourlyRateSnapshot: price.hourlyRateSnapshot,
            securityDepositSnapshot: price.securityDepositSnapshot,
            subtotal: price.subtotal,
            totalAmount: price.totalAmount,
            status: 'pending',
            crewSize: data.crewSize,
            productionType: data.productionType,
            notes: data.notes,
          },
        ],
        { session }
      );

      bookingResult = bookingDocs[0];
    });

    return bookingResult;
  } catch (err: any) {
    if (
      err.message?.includes('Transaction numbers') ||
      err.message?.includes('does not support') ||
      (err as any).code === 20 ||
      err.message?.includes('replica set')
    ) {
      console.warn('Transactions not supported, falling back to non-transactional booking check');

      const blocking = await Booking.find({
        studio: studioId,
        bookingDate,
        status: { $in: ['pending', 'confirmed'] },
        startMinutes: { $lt: endMinutes },
        endMinutes: { $gt: startMinutes },
      } as any);

      if (blocking.length > 0) {
        throw createError('Booking conflict: Time slot already booked', 409);
      }

      const booking = await Booking.create({
        studio: studioId,
        user: userId,
        host: studio.owner,
        bookingDate,
        startTime,
        endTime,
        startMinutes,
        endMinutes,
        duration: price.duration,
        hourlyRateSnapshot: price.hourlyRateSnapshot,
        securityDepositSnapshot: price.securityDepositSnapshot,
        subtotal: price.subtotal,
        totalAmount: price.totalAmount,
        status: 'pending',
        crewSize: data.crewSize,
        productionType: data.productionType,
        notes: data.notes,
      });

      return booking;
    }

    throw err;
  } finally {
    await session.endSession();
  }
};

export const getMyBookings = async (
  userId: string,
  query: { status?: string; page?: number; limit?: number; sort?: string }
) => {
  const { status = 'all', page = 1, limit = 10, sort = 'newest' } = query;
  const filter: any = { user: userId };
  if (status !== 'all') filter.status = status;

  const sortOption: any = sort === 'date-asc' ? { bookingDate: 1 } : { createdAt: -1 };
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('studio', 'title images location hourlyRate')
      .populate('host', 'name email photoURL')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getHostBookings = async (
  hostId: string,
  query: { status?: string; page?: number; limit?: number; studioId?: string }
) => {
  const { status = 'all', page = 1, limit = 10, studioId } = query;
  const filter: any = { host: hostId };
  if (status !== 'all') filter.status = status;
  if (studioId) filter.studio = studioId;

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('studio', 'title images location hourlyRate')
      .populate('user', 'name email photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getBookingById = async (bookingId: string, requesterId: string) => {
  const booking = await Booking.findById(bookingId)
    .populate('studio')
    .populate('user', 'name email photoURL')
    .populate('host', 'name email photoURL');

  if (!booking) throw createError('Booking not found', 404);

  const userStr = booking.user.toString();
  const hostStr = booking.host.toString();
  const userPopulated = (booking.user as any)._id?.toString();
  const hostPopulated = (booking.host as any)._id?.toString();

  const isOwner = userStr === requesterId || userPopulated === requesterId;
  const isHost = hostStr === requesterId || hostPopulated === requesterId;

  if (!isOwner && !isHost) {
    throw createError('Forbidden: Not authorized to view this booking', 403);
  }

  return booking;
};

export const updateBookingStatus = async (
  bookingId: string,
  hostId: string,
  newStatus: 'confirmed' | 'rejected' | 'completed'
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw createError('Booking not found', 404);

  if (booking.host.toString() !== hostId) {
    throw createError('Forbidden: Only host can update status', 403);
  }

  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'rejected', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    rejected: [],
    cancelled: [],
    completed: [],
  };

  const allowed = validTransitions[booking.status] || [];
  if (!allowed.includes(newStatus)) {
    throw createError(
      `Invalid status transition: ${booking.status} -> ${newStatus}`,
      409
    );
  }

  booking.status = newStatus;
  await booking.save();

  return booking;
};

export const cancelBooking = async (bookingId: string, userId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw createError('Booking not found', 404);

  const isBooker = booking.user.toString() === userId;
  const isHost = booking.host.toString() === userId;

  if (!isBooker && !isHost) {
    throw createError('Forbidden: Not authorized to cancel', 403);
  }

  if (['cancelled', 'rejected', 'completed'].includes(booking.status)) {
    throw createError(`Cannot cancel booking with status ${booking.status}`, 409);
  }

  if (booking.status === 'pending') {
    booking.status = 'cancelled';
    await booking.save();
    return booking;
  }

  if (booking.status === 'confirmed') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bDate = new Date(booking.bookingDate);
    bDate.setHours(0, 0, 0, 0);
    if (bDate < today) {
      throw createError('Cannot cancel past confirmed booking', 409);
    }
    booking.status = 'cancelled';
    await booking.save();
    return booking;
  }

  throw createError('Cannot cancel this booking in current status', 409);
};

