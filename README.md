# 🚕 Smart Ride

**Smart Ride** is a full-stack subscription-based ride booking platform built with **React, Node.js, Express, MongoDB, and Socket.IO**.

Instead of paying for every ride, users choose a monthly subscription plan that includes a fixed number of rides. Captains can accept rides and update their live location, while users can track the ride in real time.

## ✨ Features

### 👤 User Features

* User registration and login
* JWT-based authentication
* Protected user routes
* Browse available subscription plans
* Subscribe to a monthly ride plan
* View current subscription and remaining rides
* Book rides using pickup and destination
* Get ride estimate information
* Cancel rides and receive the ride quota back
* Live ride status updates
* Real-time captain tracking

### 🚕 Captain Features

* Captain registration and login
* Vehicle information management
* Protected captain dashboard
* Receive nearby ride requests
* Accept and confirm rides
* Start rides using OTP verification
* End rides
* Share live location with the server
* Real-time ride communication using Socket.IO

### 📦 Subscription System

Smart Ride provides three default plans:

| Plan     | Price / Month | Rides / Month | Vehicle |
| -------- | ------------- | ------------- | ------- |
| Basic    | ₹1,499        | 20            | Auto    |
| Standard | ₹3,499        | 45            | Car     |
| Premium  | ₹5,999        | 60            | Car     |

The default plans are automatically created when the backend connects to an empty database.

## 🛠️ Tech Stack

### Frontend

* React 18
* Vite
* React Router
* Tailwind CSS
* Axios
* Socket.IO Client
* GSAP
* React Leaflet
* MapLibre
* Remix Icon

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcrypt
* Socket.IO
* Express Validator
* Axios
* CORS
* dotenv

### APIs / Services

* Geoapify for location and mapping services
* MongoDB for database storage
* Socket.IO for real-time communication

## 📁 Project Structure

```text
SMART-RIDE-
│
├── Backend/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── app.js
│   ├── server.js
│   ├── socket.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── .env
│
└── README.md
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/SMART-RIDE-.git
cd SMART-RIDE-
```

### 2. Setup Backend

```bash
cd Backend
npm install
```

Create a `.env` file:

```env
PORT=3000
DB_CONNECT=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
GEOAPIFY_API_KEY=your_geoapify_api_key
```

Start the backend:

```bash
npm start
```

The backend will run on:

```text
http://localhost:3000
```

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_BASE_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000
VITE_GEOAPIFY_API_KEY=your_geoapify_api_key
```

Start the frontend:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

## 🔐 Authentication

Smart Ride uses **JWT authentication** to protect user and captain routes.

Authenticated requests use:

```text
Authorization: Bearer <token>
```

The backend also uses HTTP cookies for authentication-related flows.

## 🔌 Real-Time Communication

Smart Ride uses **Socket.IO** for real-time communication between users and captains.

Examples include:

* Captain location updates
* New ride notifications
* Ride acceptance
* Ride status changes
* OTP delivery
* Live ride tracking

Captains periodically send their location to the backend, which stores the latest coordinates for ride matching and tracking.

## 🚗 Ride Flow

```text
User
  ↓
Select Subscription Plan
  ↓
Create Ride
  ↓
Ride Quota Decreases
  ↓
Nearby Captain Matching
  ↓
Captain Accepts Ride
  ↓
OTP Verification
  ↓
Ride Starts
  ↓
Live Location Tracking
  ↓
Ride Ends
```

A ride is booked against the user's active subscription, so there is **no per-ride cash payment**.

## 📡 Main API Endpoints

### User

```http
POST /users/register
POST /users/login
GET  /users/profile
GET  /users/logout
```

### Captain

```http
POST /captains/register
POST /captains/login
GET  /captains/profile
GET  /captains/logout
```

### Plans

```http
GET /plans
GET /plans/:planId
```

### Subscriptions

```http
POST /subscriptions/subscribe
GET  /subscriptions/me
POST /subscriptions/cancel
```

### Rides

```http
POST /rides/create
GET  /rides/get-estimate
POST /rides/confirm
GET  /rides/start-ride
POST /rides/end-ride
POST /rides/cancel
```

### Maps

```http
GET /maps/get-coordinates
GET /maps/get-distance-time
GET /maps/get-suggestions
```

## 🗄️ Database

MongoDB is used to store:

* Users
* Captains
* Rides
* Subscription plans
* User subscriptions
* Blacklisted authentication tokens

Mongoose is used as the ODM for MongoDB.

## 🌍 Deployment

The frontend is configured for **Vercel** deployment using `vercel.json`.

For production deployment, make sure the frontend environment variables point to the deployed backend and the backend `CLIENT_URL` allows the deployed frontend origin.

## 🔒 Environment Variables

Never commit your `.env` files or API keys to GitHub.

Example:

```text
Backend/.env
frontend/.env
```

Add them to `.gitignore`:

```gitignore
.env
.env.local
node_modules/
dist/
```

## 🚀 Future Improvements

* Online payment integration
* Ride history
* Driver ratings and reviews
* Push notifications
* Admin dashboard
* Better captain matching algorithms
* Improved pricing and subscription management
* Production monitoring and logging

## 📄 License

This project is licensed under the **ISC License**.

---

### 👨‍💻 Author

**Rishabh**

Built as a full-stack ride-booking and subscription platform using modern web technologies.

