const dotenv = require('dotenv');
dotenv.config();


const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({
  origin: 'https://rishabhdev06-smart-ride.vercel.app',
  credentials: true
}));
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');
const planRoutes = require('./routes/plan.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const planService = require('./services/plan.service');

connectToDb().then(() => {
    planService.ensureDefaultPlans().catch(err => console.log(err));
});

const allowedOrigins = (process.env.CLIENT_URL || '*')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''));

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.get('/', (req, res) => {
    res.send('Smart Ride API');
});

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);
app.use('/plans', planRoutes);
app.use('/subscriptions', subscriptionRoutes);




module.exports = app;
