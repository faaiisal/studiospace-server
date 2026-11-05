import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type AuthProvider = 'local' | 'google';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  photoURL?: string;
  authProvider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    name: string;
  };
}

export type StudioCategory =
  | 'daylight-loft'
  | 'cyclorama'
  | 'soundstage'
  | 'black-box'
  | 'industrial-warehouse'
  | 'rooftop'
  | 'other';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

