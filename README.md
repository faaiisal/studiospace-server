# StudioSpace Server

Express.js + TypeScript + MongoDB backend for StudioSpace creative workspace marketplace.

## Tech Stack
- Node.js + Express 5
- TypeScript
- MongoDB + Mongoose
- Zod validation
- JWT + HTTPOnly cookies
- Helmet + CORS + Rate Limiting

## Setup

1. Copy `.env.example` to `.env` and fill values:
```bash
cp .env.example .env
```

2. Install dependencies:
```bash
npm install
```

3. Run dev server:
```bash
npm run dev
```

## Scripts
- `npm run dev` - Run with tsx watch
- `npm run build` - Build to dist/
- `npm start` - Run built server
- `npm run lint` - Lint (if configured)

## API Documentation
See `../project-docs/API_DOCUMENTATION.md`

## Endpoints
- `GET /health` - Health check
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `GET /api/studios` - Explore studios (search, filter, sort, paginated)
- `GET /api/studios/featured` - Featured (limit 6)
- `GET /api/studios/:id` - Studio details
- `GET /api/studios/my-listings` - Owner listings
- `POST /api/studios` - Create studio
- `PATCH /api/studios/:id` - Update studio
- `DELETE /api/studios/:id` - Delete studio
- `POST /api/bookings` - Create booking with overlap prevention
- `GET /api/bookings/my-bookings` - User bookings
- `GET /api/bookings/host-bookings` - Host bookings
- `PATCH /api/bookings/:id/status` - Confirm/reject
- `PATCH /api/bookings/:id/cancel` - Cancel
- `POST /api/wishlist` - Add to wishlist
- `GET /api/wishlist` - List wishlist
- `DELETE /api/wishlist/:id` - Remove

## Security
- Password hashing bcrypt
- JWT HTTPOnly cookies
- CORS allowlist
- Helmet headers
- Rate limiting
- Zod validation (no raw query injection)
- Ownership checks
- Server-side price calculation
- Booking overlap prevention with transaction-safe strategy

