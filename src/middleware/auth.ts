import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import User from '../modules/users/user.model';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      (req.cookies as any)?.accessToken ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided',
      });
    }

    const decoded = verifyToken(token);

    // Verify user still exists
    const user = await User.findById(decoded.userId).select('_id name email');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token =
      (req.cookies as any)?.accessToken ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('_id name email');
      if (user) {
        req.user = {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      }
    }
  } catch {
    // ignore for optional auth
  }
  next();
};

