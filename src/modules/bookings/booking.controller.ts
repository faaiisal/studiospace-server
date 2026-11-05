import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './booking.service';

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await service.createBooking(req.user!._id, req.body);
    res.status(201).json({ success: true, message: 'Booking requested', data: booking });
  } catch (err) {
    next(err);
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.getMyBookings(req.user!._id, req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getHostBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.getHostBookings(req.user!._id, req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await service.getBookingById(req.params.id as string, req.user!._id);
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await service.updateBookingStatus(
      req.params.id as string,
      req.user!._id,
      req.body.status
    );
    res.status(200).json({ success: true, message: `Booking ${req.body.status}`, data: booking });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await service.cancelBooking(req.params.id as string, req.user!._id);
    res.status(200).json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (err) {
    next(err);
  }
};

