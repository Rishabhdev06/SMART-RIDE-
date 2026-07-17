# Smart Ride — Monthly Pickup & Drop Subscription Platform

Smart Ride is a subscription-based ride platform: riders subscribe to a
monthly plan (**Basic**, **Standard**, or **Premium**) and use their
included pickups & drops throughout the month — no per-ride fares, no cash.

This repo contains:

- **`Backend/`** — Node.js/Express/MongoDB API (auth, plans, subscriptions,
  rides, live captain matching over Socket.IO).
- **`frontend/`** — React + Vite single-page app for riders and captains.

## How it works

1. A user signs up and browses `GET /plans` for the three monthly tiers.
2. They subscribe via `POST /subscriptions/subscribe`, which starts a
   30-day window with a ride quota (`ridesPerMonth`) tied to their plan.
3. Booking a ride (`POST /rides/create`) consumes one ride from that
   quota and matches nearby captains for the plan's vehicle type — no fare
   is calculated or charged per trip.
4. Riders can check remaining rides and cancel any time via
   `GET /subscriptions/me` and `POST /subscriptions/cancel`.

See [`Backend/README.md`](./Backend/README.md) for the full API reference.

## Quick start

```bash
# Backend
cd Backend
npm install
cp .env.example .env    # fill in DB_CONNECT, JWT_SECRET, GOOGLE_MAPS_API
npm start

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env    # set VITE_BASE_URL to the backend URL
npm run dev
```

The default subscription plans (Basic/Standard/Premium) are seeded
automatically the first time the backend connects to an empty database.

## Tech stack

- Backend: Express, Mongoose/MongoDB, JWT auth, Socket.IO, express-validator
- Frontend: React, Vite, Tailwind CSS, GSAP, Socket.IO client, Google Maps API

## License

ISC
