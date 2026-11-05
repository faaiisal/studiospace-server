import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, getMe, findOrCreateGoogleUser } from './auth.service';
import { AuthRequest } from '../../types';
import { env } from '../../config/env';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ('none' as const) : ('lax' as const),
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  path: '/',
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await registerUser(req.body);
    res
      .cookie('accessToken', token, cookieOptions)
      .status(201)
      .json({ success: true, message: 'User registered successfully', data: { user } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await loginUser(req.body);
    res
      .cookie('accessToken', token, cookieOptions)
      .status(200)
      .json({ success: true, message: 'Login successful', data: { user } });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res
      .clearCookie('accessToken', {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? 'none' : 'lax',
        path: '/',
      })
      .status(200)
      .json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const user = await getMe(userId);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// Google OAuth placeholder - implement actual OAuth flow
export const googleAuth = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth not configured',
      });
    }

    const crypto = await import('crypto');
    const state = crypto.randomBytes(16).toString('hex');
    // Store state in cookie for validation
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    const storedState = (req.cookies as any)?.oauth_state;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Missing code' });
    }

    if (env.isProduction && state !== storedState) {
      return res.status(401).json({ success: false, message: 'Invalid state' });
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = (await tokenRes.json()) as any;

    if (!tokenRes.ok) {
      console.error('Google token exchange failed', tokenData);
      return res.status(401).json({ success: false, message: 'Google token exchange failed' });
    }

    const accessToken = tokenData.access_token;

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = (await userInfoRes.json()) as any;

    if (!profile.email) {
      return res.status(400).json({ success: false, message: 'Google profile missing email' });
    }

    const { user, token } = await findOrCreateGoogleUser({
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      photoURL: profile.picture,
    });

    res
      .clearCookie('oauth_state')
      .cookie('accessToken', token, cookieOptions)
      .redirect(`${env.FRONTEND_URL}/dashboard?oauth=success`);

    // We already sent redirect, but return for type safety
    return;
  } catch (err) {
    next(err);
  }
};

