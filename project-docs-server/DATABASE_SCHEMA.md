# DATABASE_SCHEMA — StudioSpace Server

Intended DB: `studiospace` – explicitly set via `mongoose.connect(env.MONGO_URI, {dbName:'studiospace'})`.

See frontend DATABASE_SCHEMA.md for full schemas – this file mirrors server models.

## Models Location
- `src/modules/users/user.model.ts`
- `src/modules/studios/studio.model.ts`
- `src/modules/bookings/booking.model.ts`
- `src/modules/wishlist/wishlist.model.ts`

## Key Implementation Details

### User Model
- name 2-50, email unique lower, passwordHash select:false, photoURL, authProvider local|google, timestamps, toJSON strips hash.

### Studio Model
- Title 3-100, category lower, description 20-5000, hourlyRate 10-10000, securityDeposit, maxCapacity 1-500, location 3-200, images url array 1-10, amenities min1, owner ObjectId ref, rating 0-5 default 0, reviewCount 0, sqFt, ceilingHeight, powerAmperage 100|200|400, stcRating 0-100, isActive true, timestamps.
- Indexes: category, location, hourlyRate, owner, isActive, rating -1, createdAt -1, text title+description+location

### Booking Model
- Studio, user, host refs, bookingDate YYYY-MM-DD regex, startTime/endTime string, startMinutes/endMinutes int, duration min 0.5, hourlyRateSnapshot, securityDepositSnapshot, subtotal, totalAmount, status pending default enum, crewSize, productionType, notes, timestamps.
- Indexes: (studio,bookingDate,status), (studio,bookingDate,startMinutes,endMinutes), (user,status,createdAt), (host,status,createdAt), bookingDate
- Overlap: isOverlapping utility + query status in pending,confirmed + start $lt newEnd + end $gt newStart
- Transaction: startSession + withTransaction, fallback non-transactional if standalone error code 20

### Wishlist Model
- user, studio refs, timestamps, unique compound user+studio, index user createdAt -1

## Security & Backup
- Atlas URI should include /studiospace before query or use dbName option – fixed.
- Unique email index prevents duplicate registration
- Booking overlap prevented at DB level via query + transaction
- Wishlist unique prevents duplicate saves
- Backup: Atlas daily snapshots, retention, point-in-time – verify via UI (NOT VERIFIED)
- Credentials: never commit real password in .env.example – now placeholder, rotate leaked password previous commit
