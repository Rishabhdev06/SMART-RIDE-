# Smart Ride Backend

Monthly Pickup & Drop Subscription Platform - API server.

Riders subscribe to a monthly plan (Basic / Standard / Premium). Each plan
grants a fixed number of pickups & drops per month in a given vehicle type.
Every ride is booked against the rider's active subscription and deducts one
ride from that month's quota - there is no per-ride fare or cash payment.

## Setup

```
cd Backend
npm install
cp .env.example .env   # fill in DB_CONNECT, JWT_SECRET, GOOGLE_MAPS_API
npm start
```

The three default plans (Basic, Standard, Premium) are seeded automatically
the first time the server connects to an empty database.

## Environment variables

- `PORT` - port to listen on (default 3000)
- `DB_CONNECT` - MongoDB connection string
- `JWT_SECRET` - secret used to sign auth tokens
- `GOOGLE_MAPS_API` - Google Maps API key (geocoding, distance matrix, autocomplete)

## Plans

### GET /plans
List all available subscription plans.

Response: `200 OK`
```json
[
  { "_id": "...", "name": "Basic", "description": "...", "pricePerMonth": 1499, "ridesPerMonth": 20, "vehicleType": "auto" },
  { "_id": "...", "name": "Standard", "pricePerMonth": 3499, "ridesPerMonth": 45, "vehicleType": "car" },
  { "_id": "...", "name": "Premium", "pricePerMonth": 5999, "ridesPerMonth": 60, "vehicleType": "car" }
]
```

### GET /plans/:planId
Fetch a single plan by id.

## Subscriptions

All subscription routes require the `Authorization: Bearer <token>` header
for a logged-in user.

### POST /subscriptions/subscribe
Subscribe the current user to a plan. Fails if they already have an active
subscription.

Request body:
```json
{ "planId": "<plan id>" }
```

Response: `201 Created` - the new subscription, including `ridesAllotted`,
`ridesUsed`, `ridesRemaining`, `startDate`, and `endDate` (one month later).

### GET /subscriptions/me
Fetch the current user's active subscription, or `null` if they don't have
one. Subscriptions past their `endDate` are lazily marked `expired`.

### POST /subscriptions/cancel
Cancel the current user's active subscription.

## Rides

Ride booking now runs entirely off the rider's subscription - there is no
`vehicleType` choice or fare at booking time. The vehicle type used is the
one attached to the rider's plan.

### POST /rides/create
Requires `authUser`. Books a ride and deducts one ride from the caller's
active subscription. Fails with `400` if there is no active subscription or
the monthly quota is used up.

Request body:
```json
{ "pickup": "...", "destination": "..." }
```

### GET /rides/get-estimate
Requires `authUser`. Returns an informational value estimate for a
pickup/destination pair using the rider's plan vehicle type. This is never
charged - it's shown for reference only.

### POST /rides/confirm
Requires `authCaptain`. Captain accepts a pending ride.

### GET /rides/start-ride
Requires `authCaptain`. Starts a ride after OTP verification.

### POST /rides/end-ride
Requires `authCaptain`. Marks a ride completed.

### POST /rides/cancel
Requires `authUser`. Cancels a pending/accepted ride and refunds the ride
back to the rider's monthly quota.

## Users, Captains, Maps

Unchanged from the base ride-hailing API - see the route files under
`routes/` for `users`, `captains`, and `maps`.
