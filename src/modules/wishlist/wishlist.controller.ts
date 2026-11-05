import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './wishlist.service';

export const addToWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await service.addToWishlist(req.user!._id, req.body.studio);
    res.status(201).json({ success: true, message: 'Added to wishlist', data: item });
  } catch (err) {
    next(err);
  }
};

export const getWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.getWishlist(req.user!._id, req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.removeFromWishlist(req.user!._id, req.params.id as string);
    res.status(200).json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    next(err);
  }
};

