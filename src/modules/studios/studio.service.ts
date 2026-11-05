import Studio from './studio.model';
import { createError } from '../../middleware/errorHandler';
import Booking from '../bookings/booking.model';

interface CreateStudioInput {
  title: string;
  category: string;
  description: string;
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  images: string[];
  amenities: string[];
  squareFootage?: number;
  ceilingHeight?: number;
  powerAmperage?: number;
  stcRating?: number;
}

export const createStudio = async (
  ownerId: string,
  ownerName: string,
  ownerEmail: string,
  data: CreateStudioInput
) => {
  const studio = await Studio.create({
    ...data,
    owner: ownerId,
    ownerName,
    ownerEmail,
  });
  return studio;
};

export const getStudios = async (query: {
  q?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  const {
    q,
    category,
    location,
    minPrice,
    maxPrice,
    minRating,
    amenities,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = query;

  const filter: any = { isActive: true };

  if (q) {
    // Use regex search for flexibility if text index fails, but primary is text
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
    ];
  }

  if (category) {
    const categories = category.split(',').map((c) => c.trim().toLowerCase());
    filter.category = { $in: categories };
  }

  if (location && !q) {
    filter.location = { $regex: location, $options: 'i' };
  } else if (location && q) {
    // If q already uses location, we keep category filter overlay
    // Additional location refinement
    filter.location = { $regex: location, $options: 'i' };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.hourlyRate = {};
    if (minPrice !== undefined) filter.hourlyRate.$gte = minPrice;
    if (maxPrice !== undefined) filter.hourlyRate.$lte = maxPrice;
  }

  if (minRating !== undefined) {
    filter.rating = { $gte: minRating };
  }

  if (amenities) {
    const amList = amenities.split(',').map((a) => a.trim());
    filter.amenities = { $all: amList };
  }

  let sortOption: any = { createdAt: -1 };
  switch (sort) {
    case 'price-asc':
      sortOption = { hourlyRate: 1 };
      break;
    case 'price-desc':
      sortOption = { hourlyRate: -1 };
      break;
    case 'rating-desc':
      sortOption = { rating: -1, reviewCount: -1 };
      break;
    case 'capacity-desc':
      sortOption = { maxCapacity: -1 };
      break;
    case 'size-desc':
      sortOption = { squareFootage: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  const [studios, total] = await Promise.all([
    Studio.find(filter).sort(sortOption).skip(skip).limit(limit).lean().exec(),
    Studio.countDocuments(filter),
  ]);

  return {
    studios,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getFeaturedStudios = async (limit = 6) => {
  const studios = await Studio.find({ isActive: true })
    .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
  return studios;
};

export const getStudioById = async (id: string) => {
  const studio = await Studio.findById(id).populate('owner', 'name photoURL').lean();
  if (!studio) throw createError('Studio not found', 404);
  return studio;
};

export const getMyListings = async (ownerId: string) => {
  const studios = await Studio.find({ owner: ownerId }).sort({ createdAt: -1 }).lean();
  return studios;
};

export const updateStudio = async (
  studioId: string,
  ownerId: string,
  data: Partial<CreateStudioInput & { isActive?: boolean }>
) => {
  const studio = await Studio.findById(studioId);
  if (!studio) throw createError('Studio not found', 404);

  if (studio.owner.toString() !== ownerId) {
    throw createError('Forbidden: Not owner of this studio', 403);
  }

  const safeData = { ...data } as any;
  delete safeData.owner;
  delete safeData.ownerName;
  delete safeData.ownerEmail;
  delete safeData.rating;
  delete safeData.reviewCount;

  Object.assign(studio, safeData);
  await studio.save();

  return studio;
};

export const deleteStudio = async (studioId: string, ownerId: string) => {
  const studio = await Studio.findById(studioId);
  if (!studio) throw createError('Studio not found', 404);

  if (studio.owner.toString() !== ownerId) {
    throw createError('Forbidden: Not owner', 403);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const blocking = await Booking.findOne({
    studio: studioId,
    bookingDate: { $gte: todayStr },
    status: { $in: ['pending', 'confirmed'] },
  } as any);

  if (blocking) {
    throw createError('Cannot delete studio with upcoming pending/confirmed bookings', 409);
  }

  await Studio.findByIdAndDelete(studioId);
  return true;
};

