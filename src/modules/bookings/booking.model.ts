import mongoose, { Schema, Document, Types } from 'mongoose';
import { BookingStatus } from '../../types';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  studio: Types.ObjectId;
  user: Types.ObjectId;
  host: Types.ObjectId;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  startMinutes: number;
  endMinutes: number;
  duration: number; // hours
  hourlyRateSnapshot: number;
  securityDepositSnapshot: number;
  subtotal: number;
  totalAmount: number;
  status: BookingStatus;
  crewSize?: number;
  productionType?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    studio: {
      type: Schema.Types.ObjectId,
      ref: 'Studio',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingDate: {
      type: String,
      required: [true, 'Booking date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format YYYY-MM-DD'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time required'],
    },
    startMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 1439,
    },
    endMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 1440,
    },
    duration: {
      type: Number,
      required: true,
      min: 0.5,
    },
    hourlyRateSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    securityDepositSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    crewSize: {
      type: Number,
      min: 1,
      max: 500,
    },
    productionType: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Critical indexes for overlap checking and queries
bookingSchema.index({ studio: 1, bookingDate: 1, status: 1 });
bookingSchema.index({ studio: 1, bookingDate: 1, startMinutes: 1, endMinutes: 1 });
bookingSchema.index({ user: 1, status: 1, createdAt: -1 });
bookingSchema.index({ host: 1, status: 1, createdAt: -1 });
bookingSchema.index({ bookingDate: 1 });

// Ensure blocking bookings lookup is efficient
bookingSchema.index({
  studio: 1,
  bookingDate: 1,
  status: 1,
  startMinutes: 1,
  endMinutes: 1,
});

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;

