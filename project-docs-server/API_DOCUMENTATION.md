# StudioSpace — API Documentation (Proposed Contract)

> **Status: PROPOSED CONTRACT — NOT YET FULLY IMPLEMENTED**
> This document defines the intended API for StudioSpace. Endpoints will be implemented incrementally per Phases 3-7. After implementation, this file will be updated to match actual routes, schemas, and responses.
> Last Updated: 2026-11-02

---

## Table of Contents
1. [Conventions](#conventions)
2. [Authentication APIs](#1-authentication-apis)
3. [User APIs](#2-user-apis)
4. [Studio APIs](#3-studio-apis)
5. [Booking APIs](#4-booking-apis)
6. [Wishlist APIs](#5-wishlist-apis)
7. [Common Errors](#common-errors)
8. [Security Notes](#security-notes)

---

## Conventions

- **Base URL:** `http://localhost:5000/api` (dev), `https://<render-host>/api` (prod)
- **Auth Mechanism:** JWT stored in **HTTPOnly** cookies (`accessToken`). Client sends `credentials: 'include'`.
- **Cookie Settings:**
  - `httpOnly: true`
  - `secure: true` in production, `false` in dev
  - `sameSite: None` if cross-site (Vercel <> Render) with `secure:true`, else `Lax`
  - `maxAge: 1d` (or 15m access + 7d refresh for advanced flow)
- **Response Envelope:**
```json
{
  "success": true,
  "message": "Human readable",
  "data": { ... }
}
```
- **Error Envelope:**
```json
{
  "success": false,
  "message": "Error description",
  "error": { "details": "..." }
}
```
- **Validation:** All inputs validated with **Zod**. No raw MongoDB query objects allowed.
- **IDs:** MongoDB ObjectId strings, validated with `z.string().regex(/^[0-9a-fA-F]{24}$/)`.
- **Pagination Default:** `page=1`, `limit=12`, `maxLimit=50`

---

## 1. Authentication APIs

### 1.1 POST /api/auth/register
- **Purpose:** Register new creator/host user
- **Auth:** Public
- **Authorization:** None
- **Request Body Schema:**
```ts
{
  name: string (min 2, max 50),
  email: string (email),
  password: string (min 6, at least one uppercase, one lowercase),
  photoURL?: string (url, optional)
}
```
- **Validation:** Email unique, password regex `/(?=.*[a-z])(?=.*[A-Z]).{6,}/`
- **Example Request:**
```json
{
  "name": "Alex Rivera",
  "email": "alex@productionlab.com",
  "password": "Secure1",
  "photoURL": "https://i.ibb.co/xxx.jpg"
}
```
- **Success Response 201:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "66...",
      "name": "Alex Rivera",
      "email": "alex@productionlab.com",
      "photoURL": "https://...",
      "authProvider": "local",
      "createdAt": "2026-11-02T..."
    }
  }
}
```
- **Sets Cookie:** `accessToken=jwt...; HttpOnly`
- **Errors:** 400 validation, 409 email exists
- **Business Rules:** Hash password bcrypt 10 rounds, never return passwordHash.

### 1.2 POST /api/auth/login
- **Purpose:** Authenticate user, issue JWT cookie
- **Auth:** Public
- **Body:**
```json
{ "email": "alex@productionlab.com", "password": "Secure1" }
```
- **Success 200:** Same user object + cookie
- **Errors:** 400 validation, 401 invalid credentials
- **Business Rules:** If `authProvider === 'google'`, reject local login with message to use Google.

### 1.3 POST /api/auth/logout
- **Purpose:** Clear auth cookie
- **Auth:** Authenticated (but also allow public to clear)
- **Body:** None
- **Success 200:**
```json
{ "success": true, "message": "Logged out successfully" }
```
- **Implementation:** `res.clearCookie('accessToken', { httpOnly:true, secure: prod, sameSite })`
- **Errors:** None (idempotent)

### 1.4 GET /api/auth/me
- **Purpose:** Get current authenticated user from cookie
- **Auth:** Required (HTTPOnly cookie)
- **Success 200:**
```json
{
  "success": true,
  "data": { "user": { "_id": "...", "name": "...", "email": "...", "photoURL": "..." } }
}
```
- **Errors:** 401 Unauthorized (no/invalid token)
- **Note:** Duplicate of GET /api/users/me but canonical for auth provider switching. If using BetterAuth, this endpoint may be provided by provider; otherwise custom.

### 1.5 GET /api/auth/google
- **Purpose:** Initiate Google OAuth flow
- **Auth:** Public
- **Implementation:** Redirect to Google OAuth consent with `state` param (CSRF protection). URL: `https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email profile&state=random`
- **Success:** 302 Redirect
- **Errors:** 500 if Google creds not configured

### 1.6 GET /api/auth/google/callback
- **Purpose:** Google OAuth callback, exchange code for tokens, create/find user, set cookie, redirect to frontend
- **Auth:** Public (query `code` & `state`)
- **Query Params:** `code`, `state`
- **Validation:** Verify state, exchange code, fetch Google profile, find or create user with `authProvider: 'google'`, set JWT cookie.
- **Success:** 302 Redirect to `${FRONTEND_URL}/dashboard?oauth=success` or `/`
- **Errors:** 401 state mismatch, 400 invalid code, 500 exchange fail
- **Security:** State validation required, PKCE if possible.

---

## 2. User APIs

### 2.1 GET /api/users/me
- **Purpose:** Get own profile
- **Auth:** Required
- **Success 200:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Alex Rivera",
    "email": "alex@productionlab.com",
    "photoURL": "https://...",
    "authProvider": "local",
    "createdAt": "..."
  }
}
```
- **Errors:** 401

### 2.2 PATCH /api/users/me
- **Purpose:** Update own profile (whitelisted fields only)
- **Auth:** Required
- **Authorization:** Self only
- **Body Schema:**
```ts
{
  name?: string (2-50),
  photoURL?: string (url)
  // email update disallowed in v1 to prevent hijack, password change separate endpoint future
}
```
- **Example:**
```json
{ "name": "Alex Rivera Updated", "photoURL": "https://..." }
```
- **Success 200:** Updated user object
- **Errors:** 400 validation, 401, 422 mass assignment attempt
- **Business Rules:** Mass assignment protection – only allow `name`, `photoURL`. No role escalation.

---

## 3. Studio APIs

### 3.1 POST /api/studios
- **Purpose:** Create new studio listing
- **Auth:** Required
- **Body Schema:**
```ts
{
  title: string (3-100),
  category: enum ['daylight-loft','cyclorama','soundstage','black-box','industrial-warehouse','rooftop','other'] | string min 2,
  description: string (20-5000),
  hourlyRate: number (min 10, max 10000),
  securityDeposit: number (min 0, max 100000),
  maxCapacity: number (int min 1 max 500),
  location: string (3-200),
  images: string[] (url array, min 1 max 10),
  amenities: string[] (min 1),
  // optional advanced fields per pages.md:
  squareFootage?: number,
  ceilingHeight?: number,
  powerAmperage?: enum [100,200,400],
  stcRating?: number
}
```
- **Example Request:**
```json
{
  "title": "The Foundry Daylight Cyclorama",
  "category": "cyclorama",
  "description": "4,200 sq ft daylight cyclorama with north-facing windows...",
  "hourlyRate": 185,
  "securityDeposit": 500,
  "maxCapacity": 30,
  "location": "Greenpoint, Brooklyn",
  "images": ["https://i.ibb.co/1.jpg", "https://i.ibb.co/2.jpg"],
  "amenities": ["3-Phase 200A", "18ft Clear Height", "Freight Elevator"]
}
```
- **Success 201:**
```json
{
  "success": true,
  "message": "Studio created",
  "data": {
    "_id": "...",
    "title": "...",
    "owner": "userId",
    "ownerName": "Alex Rivera",
    "ownerEmail": "alex@...",
    "rating": 0,
    "createdAt": "..."
  }
}
```
- **Business Rules:**
  - `owner` = req.user._id, `ownerName`/`ownerEmail` denormalized from user.
  - Validate image URLs.
  - Create indexes.
- **Errors:** 400 validation, 401

### 3.2 GET /api/studios
- **Purpose:** Explore studios with search, filters, sort, pagination
- **Auth:** Public
- **Query Params:**
```
q?: string (search title, location, description)
category?: string (or comma-separated list)
location?: string (regex search)
minPrice?: number
maxPrice?: number
minRating?: number (0-5)
amenities?: string (comma-separated, e.g., "200A,STC 50+")
sort?: enum ['newest','price-asc','price-desc','rating-desc','capacity-desc','size-desc'] default newest
page?: number (default 1)
limit?: number (default 12, max 50)
```
- **Validation:** Zod query schema, coerce numbers, reject NaN, enforce max limit.
- **Example:** `/api/studios?q=daylight&category=cyclorama,daylight-loft&location=Brooklyn&minPrice=50&maxPrice=500&sort=price-asc&page=1&limit=12`
- **Success 200:**
```json
{
  "success": true,
  "data": {
    "studios": [{ "_id": "...", "title": "...", "hourlyRate": 185, "location": "...", "images": [...], "rating": 4.98, "amenities": [...] }],
    "pagination": { "page": 1, "limit": 12, "total": 42, "totalPages": 4 }
  }
}
```
- **Business Rules:** Use URL search params to allow shareable filters. Implement case-insensitive regex for q & location but escape to prevent ReDoS. Use pagination with skip/limit; consider cursor for large sets later.

### 3.3 GET /api/studios/featured
- **Purpose:** Get featured studios for home page (limit 6)
- **Auth:** Public
- **Query:** `limit?: number (default 6, max 12)`
- **Success 200:**
```json
{
  "success": true,
  "data": [{ "_id": "...", "title": "...", ... }]
}
```
- **Business Rules:** Could be sorted by rating desc, or isFeatured flag, or newest. For MVP: highest rating, limit 6.

### 3.4 GET /api/studios/:id
- **Purpose:** Get single studio details
- **Auth:** Public
- **Params:** `id` ObjectId
- **Success 200:** Full studio object with owner info (populate owner name, photoURL but not email private? spec says show host info – include safe fields)
- **Errors:** 400 invalid id, 404 not found

### 3.5 GET /api/studios/my-listings
- **Purpose:** Get studios owned by authenticated user
- **Auth:** Required
- **Query:** `status?: 'all'|'active'|'draft'|'paused'` (if status field implemented, else ignore)
- **Success 200:** Array of owner's studios
- **Errors:** 401
- **Authorization:** Only returns where `owner == req.user._id`

### 3.6 PATCH /api/studios/:id
- **Purpose:** Update own studio
- **Auth:** Required
- **Authorization:** Owner only (`studio.owner == req.user._id`)
- **Body:** Same fields as POST but all optional (partial update), with same validation.
- **Example:**
```json
{ "hourlyRate": 200, "maxCapacity": 40 }
```
- **Success 200:** Updated studio
- **Errors:** 400, 401, 403 not owner, 404
- **Business Rules:** Mass assignment protection – disallow updating `owner`, `ownerEmail`, `rating` directly. Re-validate images array.

### 3.7 DELETE /api/studios/:id
- **Purpose:** Delete own studio
- **Auth:** Required
- **Authorization:** Owner only
- **Params:** `id`
- **Success 200:**
```json
{ "success": true, "message": "Studio deleted" }
```
- **Errors:** 400, 401, 403, 404
- **Business Rules:**
  - Check if studio has future Pending/Confirmed bookings – prevent delete if exists (or allow but warn). For MVP: prevent if any blocking future bookings.
  - Delete associated wishlist entries (optional cascade).
  - No physical file delete – images are URLs.

---

## 4. Booking APIs

### Core Booking Business Logic (Critical)

- **Overlap Prevention:** For same `studio` and `bookingDate`, block if `newStart < existingEnd AND newEnd > existingStart`. Treat `Pending` and `Confirmed` as blocking. `Cancelled` and `Rejected` do NOT block.
- **Concurrency Safe Strategy:** 
  - Preferred: MongoDB transaction (requires replica set – supported on Atlas). Session: check overlapping bookings + create booking atomically.
  - Fallback if standalone: use atomic operation with unique index or `findOneAndUpdate` reservation collection, or app-level locking with retry. Must document deployment assumption.
- **Server-Side Price Calculation:**
```
duration = endTime - startTime (in hours, allow .5 increments? For MVP integer hours)
subtotal = hourlyRateSnapshot * duration (use ceil or exact)
totalAmount = subtotal + securityDepositSnapshot
```
  - Never trust client-submitted total.
  - hourlyRateSnapshot = studio.hourlyRate at booking time
  - securityDepositSnapshot = studio.securityDeposit
  - Use integer cents avoid floating errors: store amounts in dollars but calculate with `Math.round(rate*100)*duration /100` or use Decimal128.
- **Validation:** studio exists & active, date is today or future, startTime < endTime, duration >=1, user not owner of studio (prevent self-booking?), max capacity check if crew size provided.

### 4.1 POST /api/bookings
- **Purpose:** Create booking request
- **Auth:** Required
- **Body Schema:**
```ts
{
  studio: string (ObjectId),
  bookingDate: string (YYYY-MM-DD, must be >= today),
  startTime: string | number (e.g., "07:00" or 7) – MVP: use "HH:MM" 24h,
  endTime: string | number (e.g., "19:00"),
  // Optional for extended spec:
  crewSize?: number,
  productionType?: string,
  notes?: string
}
```
- **Example:**
```json
{
  "studio": "671...",
  "bookingDate": "2026-11-10",
  "startTime": "07:00",
  "endTime": "19:00",
  "crewSize": 12,
  "productionType": "Commercial"
}
```
- **Success 201:**
```json
{
  "success": true,
  "message": "Booking requested",
  "data": {
    "_id": "...",
    "studio": "...",
    "user": "...",
    "host": "...",
    "bookingDate": "2026-11-10",
    "startTime": "07:00",
    "endTime": "19:00",
    "duration": 12,
    "hourlyRateSnapshot": 185,
    "securityDepositSnapshot": 500,
    "subtotal": 2220,
    "totalAmount": 2720,
    "status": "pending",
    "createdAt": "..."
  }
}
```
- **Errors:** 400 validation, 401, 404 studio not found, 409 overlapping booking, 403 self-booking attempt
- **Implementation Steps:**
  1. Validate studio exists.
  2. Prevent owner self-booking.
  3. Parse times → minutes or hours, ensure start<end.
  4. Check date not past.
  5. Lookup blocking bookings same studio+date: `status in [pending, confirmed]` and `start < newEnd && end > newStart`.
  6. Calculate duration, subtotal, total server-side.
  7. Within transaction, re-check overlap then create booking.
  8. Return booking.

### 4.2 GET /api/bookings/my-bookings
- **Purpose:** Get bookings made by current user (as creator)
- **Auth:** Required
- **Query:**
```
status?: enum ['pending','confirmed','completed','cancelled','rejected'] | 'all'
page?: number
limit?: number
sort?: 'newest'|'date-asc'
```
- **Success 200:**
```json
{
  "success": true,
  "data": {
    "bookings": [{ "_id": "...", "studio": { "title": "...", "images": [...] }, "status": "pending", ... }],
    "pagination": { "page": 1, "limit": 10, "total": 5 }
  }
}
```
- **Authorization:** `user == req.user._id`

### 4.3 GET /api/bookings/host-bookings
- **Purpose:** Get bookings where current user is host (owner of studio)
- **Auth:** Required
- **Query:** Same as my-bookings, plus `studioId?: ObjectId` filter
- **Success 200:** Similar, but bookings where `host == req.user._id`
- **Business Rules:** Populate studio and user info for host view.

### 4.4 GET /api/bookings/:id
- **Purpose:** Get single booking detail
- **Auth:** Required
- **Authorization:** Must be either `user` (booker) or `host`.
- **Success 200:** Full booking with populated studio & user & host.
- **Errors:** 400, 401, 403 not authorized, 404

### 4.5 PATCH /api/bookings/:id/status
- **Purpose:** Host confirms or rejects booking request
- **Auth:** Required
- **Authorization:** Host only (`booking.host == req.user._id`)
- **Body:**
```json
{ "status": "confirmed" | "rejected" | "completed" }
```
- **Validation:** Enumerated allowed transitions:
  - pending -> confirmed (host) or rejected (host) or cancelled (user via other endpoint)
  - confirmed -> completed (host or auto cron) or cancelled (rules)
  - No transition from cancelled/rejected/completed elsewhere except edge.
- **Success 200:** Updated booking
- **Errors:** 400 invalid status, 401, 403 not host, 404, 409 invalid transition
- **Business Rules:** `completed` could be set by host after date passes or via CRON.

### 4.6 PATCH /api/bookings/:id/cancel
- **Purpose:** User cancels own pending booking (or confirmed with policy)
- **Auth:** Required
- **Authorization:** User (booker) can cancel if status pending; optionally confirmed if before date (with policy). Host can also cancel? Use separate status endpoint.
- **Body:** None or `{ "reason"?: string }`
- **Success 200:** Updated booking with status `cancelled`
- **Errors:** 400 already cancelled, 401, 403 not owner (booker), 404, 409 cannot cancel confirmed/less than 24h etc (define policy: for MVP allow cancel if pending, or confirmed if bookingDate future >24h)
- **Business Rules:** Cancelled bookings no longer block availability.

---

## 5. Wishlist APIs (Optional Feature)

### 5.1 POST /api/wishlist
- **Purpose:** Add studio to wishlist
- **Auth:** Required
- **Body:**
```json
{ "studio": "671..." }
```
- **Success 201:**
```json
{ "success": true, "data": { "_id": "...", "user": "...", "studio": "..." } }
```
- **Errors:** 400 validation, 401, 409 duplicate (unique index user+studio), 404 studio not found
- **Business Rules:** Prevent duplicate. Idempotent handling – return existing if duplicate rather than error? We'll choose 409 with message.

### 5.2 GET /api/wishlist
- **Purpose:** Get current user's wishlist
- **Auth:** Required
- **Query:** `page?, limit?`
- **Success 200:**
```json
{
  "success": true,
  "data": {
    "wishlist": [{ "_id": "...", "studio": { "_id": "...", "title": "...", "images": [...], "hourlyRate": 185 } }],
    "pagination": { ... }
  }
}
```

### 5.3 DELETE /api/wishlist/:id
- **Purpose:** Remove from wishlist
- **Auth:** Required
- **Authorization:** User owns wishlist entry
- **Params:** `id` – wishlist entry _id OR studio id? Spec says `:id` but ambiguous. Choose wishlist entry id; also support studioId via query `?studioId=`. We'll document as wishlist entry Id.
- **Alternative path:** `DELETE /api/wishlist/:studioId` – simpler for frontend (delete by studio). We'll support both via checking if param is studioId that matches user's wishlist.
- **Success 200:** `{ "success": true, "message": "Removed from wishlist" }`
- **Errors:** 400, 401, 403, 404

---

## Common Errors

| Code | Meaning | Example |
|------|---------|---------|
| 400 | Bad Request / Validation Failed | Invalid email, missing field, invalid ObjectId, startTime >= endTime |
| 401 | Unauthorized | No token, invalid token, expired |
| 403 | Forbidden | Not owner, not host |
| 404 | Not Found | Studio / Booking / User not found |
| 409 | Conflict | Email exists, overlapping booking, duplicate wishlist |
| 422 | Unprocessable / Mass Assignment | Trying to update restricted field |
| 429 | Too Many Requests | Rate limit hit |
| 500 | Internal Server Error | DB down, unhandled |

**Error Response Format:**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "details": [
      { "path": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## Security Notes

- **JWT:** HS256, secret from `JWT_SECRET` env, expiry 1d, store only `_id`, not sensitive.
- **Password:** bcrypt hash (10 rounds).
- **Cookie:** httpOnly, secure in prod, sameSite None for cross-origin or Lax for same-site; explicit allowlist with CORS `origin: [localhost:3000, vercel.app]`, `credentials: true`.
- **Helmet:** Security headers.
- **Rate Limit:** Auth endpoints: 5 req / 15 min per IP (login/register), general 100 req / 15 min.
- **Input Sanitization:** Zod validation strips unknown keys, no `req.query` passed directly to Mongoose.
- **Ownership Checks:** Every PATCH/DELETE verifies `owner`, `user`, or `host`.
- **Price Tamper Proof:** Server recalculates all amounts; client cannot submit total.
- **Overlap Prevention:** See booking section. Must handle concurrent requests via transactions.

---

## Implementation Checklist

- [ ] Auth module (register, login, logout, me, google oauth)
- [ ] User module (get me, patch me)
- [ ] Studio module (CRUD + featured + my-listings + search query builder)
- [ ] Booking module (create with overlap check + price calc, my, host, single, status update, cancel)
- [ ] Wishlist module (add, list, delete, unique index)
- [ ] Middleware: auth, authorize, errorHandler, rateLimiter, validateRequest
- [ ] Utils: hash, jwt, time parser, price calc
- [ ] Tests: auth, studio ownership, booking overlap concurrent

---

## Environment Variables Required (.env.example)

```
# Server
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=supersecret...
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
CLIENT_URLS=http://localhost:3000,https://your-vercel.vercel.app
BCRYPT_SALT_ROUNDS=10

# Google OAuth (optional MVP)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_IMGBB_API_KEY=... (if using ImgBB)
```

> This proposed contract will be updated after backend implementation to reflect actual schemas and responses.
