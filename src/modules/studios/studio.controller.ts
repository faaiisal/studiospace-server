import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as studioService from './studio.service';

export const createStudio = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const studio = await studioService.createStudio(
      user._id,
      user.name,
      user.email,
      req.body
    );
    res.status(201).json({ success: true, message: 'Studio created', data: studio });
  } catch (err) {
    next(err);
  }
};

export const getStudios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await studioService.getStudios(req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getFeatured = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const studios = await studioService.getFeaturedStudios(limit);
    res.status(200).json({ success: true, data: studios });
  } catch (err) {
    next(err);
  }
};

export const getStudioById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studio = await studioService.getStudioById(req.params.id as string);
    res.status(200).json({ success: true, data: studio });
  } catch (err) {
    next(err);
  }
};

export const getMyListings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studios = await studioService.getMyListings(req.user!._id);
    res.status(200).json({ success: true, data: studios });
  } catch (err) {
    next(err);
  }
};

export const updateStudio = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studio = await studioService.updateStudio(req.params.id as string, req.user!._id, req.body);
    res.status(200).json({ success: true, message: 'Studio updated', data: studio });
  } catch (err) {
    next(err);
  }
};

export const deleteStudio = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await studioService.deleteStudio(req.params.id as string, req.user!._id);
    res.status(200).json({ success: true, message: 'Studio deleted' });
  } catch (err) {
    next(err);
  }
};

