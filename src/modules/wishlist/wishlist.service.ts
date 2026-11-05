import Wishlist from './wishlist.model';
import Studio from '../studios/studio.model';
import { createError } from '../../middleware/errorHandler';

export const addToWishlist = async (userId: string, studioId: string) => {
  const studio = await Studio.findById(studioId);
  if (!studio) throw createError('Studio not found', 404);

  try {
    const item = await Wishlist.create({ user: userId, studio: studioId });
    return item;
  } catch (err: any) {
    if (err.code === 11000) {
      throw createError('Already in wishlist', 409);
    }
    throw err;
  }
};

export const getWishlist = async (
  userId: string,
  query: { page?: number; limit?: number }
) => {
  const { page = 1, limit = 12 } = query;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Wishlist.find({ user: userId })
      .populate('studio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Wishlist.countDocuments({ user: userId }),
  ]);

  return {
    wishlist: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const removeFromWishlist = async (userId: string, wishlistId: string) => {
  // Try to find by wishlist _id first, then by studioId fallback
  let item = await Wishlist.findOne({ _id: wishlistId, user: userId });

  if (!item) {
    // Fallback: treat id as studioId
    item = await Wishlist.findOne({ studio: wishlistId, user: userId });
  }

  if (!item) throw createError('Wishlist item not found', 404);

  await Wishlist.findByIdAndDelete(item._id);
  return true;
};

