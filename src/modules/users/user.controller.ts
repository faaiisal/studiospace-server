import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { getUserById, updateUser } from './user.service';

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!._id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await updateUser(req.user!._id, req.body);
    res.status(200).json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    next(err);
  }
};

