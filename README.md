# StudioSpace Server — Express + MongoDB

**Live API:** https://studiospace-server.onrender.com/api
**GitHub:** https://github.com/faaiisal/studiospace-server
**Frontend:** https://github.com/faaiisal/studiospace

## Tech Stack
- Node.js 20 + Express 5.3 + TypeScript 7
- MongoDB Atlas replica set + Mongoose 9.11
- Zod 4.6 validation, bcrypt 6.0, jsonwebtoken 9.0.3
- JWT HTTPOnly cookies SameSite lax/none secure, httpOnly true, maxAge 1d
- Helmet, CORS allowlist (CLIENT_URLS + localhost dev + vercel.app wildcard), cookie-parser, rate-limit general 200/15min auth 20/15min
- Google OAuth manual flow (state cookie, token exchange, userinfo)

## Setup & Env
```bash
cp .env.example .env
# Fill:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/studiospace?retryWrites=true&w=majority&authSource=admin
MONGODB_URL=same as MONGO_URI (alias for compatibility)
JWT_SECRET=random-32+ chars
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
FRONTEND_URL=http://localhost:3000
CLIENT_URLS=http://localhost:3000,https://your-vercel-app.vercel.app
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

npm install
npm run dev # tsx watch src/server.ts
```

## Scripts
- `npm run dev` – tsx watch
- `npm run build` – tsc to dist/
- `npm start` – node dist/server.js
- `npm run lint` – tsc --noEmit (currently)

## API Documentation
- Local: `project-docs-server/API_DOCUMENTATION.md` (now included – previously gitignored)
- Proposed contract 22 endpoints, response envelope {success, data, message}, pagination {page,limit,total,totalPages}

## Endpoints Implemented
- `GET /health` & `/api/health` – Health check
- Auth: `POST /api/auth/register` Zod name 2-50 email password regex upper+lower min6 photoURL url, `POST /login`, `POST /logout` clear cookie, `GET /me` authenticate, `GET /google` initiate, `GET /google/callback` exchange code
- Users: `GET /api/users/me`, `PATCH /api/users/me` name/photoURL
- Studios: `POST /` auth, `GET /` q category location minPrice maxPrice minRating amenities sort page limit, `GET /featured?limit=6` sorted rating reviewCount, `GET /:id` populate owner, `GET /my-listings` auth, `PATCH /:id` auth ownership, `DELETE /:id` auth ownership + block future pending/confirmed bookings 409
- Bookings: `POST /` auth future date YYYY-MM-DD, start/end HH:MM AM/PM parse, min 1h, self-booking 403, price cents math, transaction-safe overlap `newStart < existingEnd && newEnd > existingStart` query studio+bookingDate+status in[pending,confirmed]+start $lt end + end $gt start + JS loop, fallback non-transactional if replica set error code 20, `GET /my-bookings` status all/pending/confirmed/etc paginated, `GET /host-bookings` host filter optional studioId, `GET /:id` auth isOwner/isHost, `PATCH /:id/status` host only validTransitions pending->[confirmed,rejected,cancelled] confirmed->[completed,cancelled], `PATCH /:id/cancel` booker/host pending always cancellable, confirmed only future date
- Wishlist: `POST /` auth check studio exists, unique compound user+studio 11000 409, `GET /` paginated populate studio, `DELETE /:id` find by _id then studioId fallback

## Security Audit Fixes
- `.env.example` previously contained real Atlas password `studiospace:cbKnfDIdzz5jQb7Q@...` – replaced with placeholder `username:password`, must rotate Atlas user password immediately
- `config/env.ts` now supports both `MONGO_URI` and `MONGODB_URL` alias via `rawMongoUri = process.env.MONGO_URI || process.env.MONGODB_URL`, plus `dbName: 'studiospace'` explicitly in `db.ts` mongoose.connect to avoid empty path defaulting to test DB – addresses Atlas URI empty path bug `...net:27017/?ssl=true`
- CORS wildcard vercel.app permissive but documented – should tighten to exact CLIENT_URLS in prod
- JWT secret fallback dev-secret-change-in-prod – must set strong secret in Render
- Google OAuth state Math.random not crypto secure – should use crypto.randomBytes, state validation only in prod (dev bypass)
- Rate limiting auth 20/15min relatively permissive – consider 10 for login brute force
- Helmet, Zod strip unknown, ownership checks, price tamper proof (server calc snapshots)

## Deployment – Render
- Root: `cat-harry-server`
- Build: `npm install && npm run build`
- Start: `node dist/server.js` or `npm start`
- Node 20, env vars set in Render dashboard (never commit .env)
- Ensure MONGO_URI includes `/studiospace` before `?` or rely on dbName option now fixed to studiospace
- Health check path `/health`

## MongoDB Atlas
- Intended DB: `studiospace`
- Collections: users (unique email index), studios (category, location, hourlyRate, owner, isActive, rating -1, createdAt -1, text title+desc+location), bookings (studio,bookingDate,status + start/end composite, user,status,createdAt, host,status,createdAt, bookingDate), wishlists (unique user+studio, user createdAt -1)
- Backup: Enable in Atlas UI – continuous backup or snapshot schedule – NOT VERIFIED via API, need UI check
- Security: Least privilege user readWrite only studiospace, network allowlist 0.0.0.0/0 or Render IPs for MVP

## Git Status (Audit)
- Previously only README pushed (1 commit) – local src, package.json, etc untracked – now fixed .gitignore to include project-docs-server, must `git add . && commit && push`
- Required 8 notable commits – currently 1 – need to add commits after fixes
- `npm run build` PASS, `tsc --noEmit` PASS, dist exists

## Testing
- No jest tests yet – recommended to add supertest for auth/studio/booking overlap
- Manual smoke: register, login, me, add studio, my-listings, explore filters, book tomorrow 10-15 pending, host confirm, try overlapping 11-14 expect 409, cancel, wishlist add/remove, logout me 401

## Known Tech Debt
- No multer upload – images are URLs, ImgBB client-side upload in frontend if NEXT_PUBLIC_IMGBB_API_KEY set
- No centralized logger – console.* used
- No Dockerfile
- Google OAuth no refresh token stored
