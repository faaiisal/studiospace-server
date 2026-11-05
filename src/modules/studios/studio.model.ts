import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudio extends Document {
  _id: Types.ObjectId;
  title: string;
  category: string;
  description: string;
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  images: string[];
  amenities: string[];
  owner: Types.ObjectId;
  ownerName: string;
  ownerEmail: string;
  rating?: number;
  reviewCount?: number;
  squareFootage?: number;
  ceilingHeight?: number;
  powerAmperage?: number;
  stcRating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const studioSchema = new Schema<IStudio>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 chars'],
      maxlength: [100, 'Title max 100 chars'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description min 20 chars'],
      maxlength: [5000, 'Description max 5000 chars'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [10, 'Min rate $10'],
      max: [10000, 'Max rate $10000'],
    },
    securityDeposit: {
      type: Number,
      required: [true, 'Security deposit required'],
      min: [0, 'Min 0'],
      max: [100000, 'Max 100k'],
      default: 0,
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Max capacity required'],
      min: [1, 'Min 1'],
      max: [500, 'Max 500'],
    },
    location: {
      type: String,
      required: [true, 'Location required'],
      trim: true,
      minlength: [3, 'Location min 3'],
      maxlength: [200, 'Location max 200'],
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 10,
        message: 'Images must be 1-10 URLs',
      },
    },
    amenities: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 1,
        message: 'At least one amenity required',
      },
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    squareFootage: {
      type: Number,
      min: 0,
    },
    ceilingHeight: {
      type: Number,
      min: 0,
    },
    powerAmperage: {
      type: Number,
      enum: [100, 200, 400],
    },
    stcRating: {
      type: Number,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for search & filtering
studioSchema.index({ category: 1 });
studioSchema.index({ location: 1 });
studioSchema.index({ hourlyRate: 1 });
studioSchema.index({ owner: 1 });
studioSchema.index({ isActive: 1 });
studioSchema.index({ rating: -1 });
studioSchema.index({ createdAt: -1 });
studioSchema.index({ title: 'text', description: 'text', location: 'text' });

const Studio = mongoose.model<IStudio>('Studio', studioSchema);
export default Studio;

