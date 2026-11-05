import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  studio: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studio: {
      type: Schema.Types.ObjectId,
      ref: 'Studio',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate wishlist entries
wishlistSchema.index({ user: 1, studio: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });

const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
export default Wishlist;

