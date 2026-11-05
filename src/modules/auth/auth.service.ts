import User from '../users/user.model';
import { hashPassword, comparePassword } from '../../utils/hash';
import { generateToken } from '../../utils/jwt';
import { RegisterInput, LoginInput } from '../../validators/auth.validator';
import { createError } from '../../middleware/errorHandler';

export const registerUser = async (input: RegisterInput) => {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw createError('Email already registered', 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    photoURL: input.photoURL,
    authProvider: 'local',
  });

  const token = generateToken({ userId: user._id.toString(), email: user.email });

  return { user: user.toJSON(), token };
};

export const loginUser = async (input: LoginInput) => {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select(
    '+passwordHash'
  );

  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  if (user.authProvider === 'google') {
    throw createError('Please login with Google', 401);
  }

  if (!user.passwordHash) {
    throw createError('Invalid credentials', 401);
  }

  const isMatch = await comparePassword(input.password, user.passwordHash);
  if (!isMatch) {
    throw createError('Invalid credentials', 401);
  }

  const token = generateToken({ userId: user._id.toString(), email: user.email });

  // Return user without passwordHash
  const safeUser = await User.findById(user._id);

  return { user: safeUser?.toJSON(), token };
};

export const findOrCreateGoogleUser = async (profile: {
  email: string;
  name: string;
  photoURL?: string;
}) => {
  let user = await User.findOne({ email: profile.email.toLowerCase() });

  if (!user) {
    user = await User.create({
      name: profile.name,
      email: profile.email.toLowerCase(),
      photoURL: profile.photoURL,
      authProvider: 'google',
    });
  } else if (user.authProvider === 'local') {
    // Optionally link accounts: upgrade to google if needed, or keep
    // For MVP, allow google login even if local exists by updating provider? We keep as is but allow token.
    // Could also throw, but we allow.
  }

  const token = generateToken({ userId: user._id.toString(), email: user.email });

  return { user: user.toJSON(), token };
};

export const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createError('User not found', 404);
  }
  return user.toJSON();
};

