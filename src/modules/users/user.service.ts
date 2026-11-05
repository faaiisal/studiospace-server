import User from './user.model';
import { createError } from '../../middleware/errorHandler';

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw createError('User not found', 404);
  return user.toJSON();
};

export const updateUser = async (userId: string, data: { name?: string; photoURL?: string }) => {
  // Whitelisted fields only
  const update: any = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.photoURL !== undefined) update.photoURL = data.photoURL;

  if (Object.keys(update).length === 0) {
    throw createError('No valid fields to update', 400);
  }

  const user = await User.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  });

  if (!user) throw createError('User not found', 404);

  return user.toJSON();
};

