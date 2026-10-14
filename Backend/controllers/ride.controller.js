const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const subscriptionService = require('../services/subscription.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');

// CREATE RIDE
module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    if (!req.user?._id) {
        return res.status(401).json({
            message: 'Please log in again.'
        });
    }

    const { pickup, destination } = req.body;

    try {
        const ride = await rideService.createRide({
            user: req.user._id,
            pickup,
            destination
        });

        console.log('NEW RIDE CREATED:', ride._id);

        try {
            const pickupCoordinates =
                await mapService.getAddressCoordinate(pickup);

            const captainsInRadius =
                await mapService.getCaptainsInTheRadius(
                    pickupCoordinates.ltd,
                    pickupCoordinates.lng,
                    2
                );

            const rideWithUser = await rideModel
                .findById(ride._id)
                .populate('user')
                .populate('subscription');

            if (rideWithUser) {
                const rideForCaptain = rideWithUser.toObject();

                delete rideForCaptain.otp;

                captainsInRadius.forEach((captain) => {
                    if (!captain.socketId) {
                        console.log(
                            'Captain has no socket ID:',
                            captain._id
                        );
                        return;
                    }

                    const sent = sendMessageToSocketId(
                        captain.socketId,
                        {
                            event: 'new-ride',
                            data: rideForCaptain
                        }
                    );

                    console.log(
                        sent
                            ? 'NEW RIDE SENT TO CAPTAIN'
                            : 'FAILED TO SEND RIDE TO CAPTAIN'
                    );
                });
            }
        } catch (notifyErr) {
            console.error('CAPTAIN NOTIFICATION ERROR:', notifyErr);
        }

        return res.status(201).json(ride);
    } catch (err) {
        console.error('CREATE RIDE ERROR:', err);

        return res.status(400).json({
            message: err.message
        });
    }
};

// GET ESTIMATED VALUE
module.exports.getEstimatedValue = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    if (!req.user?._id) {
        return res.status(401).json({
            message: 'Please log in again.'
        });
    }

    const { pickup, destination } = req.query;

    try {
        const subscription =
            await subscriptionService.getActiveSubscription(
                req.user._id
            );

        if (!subscription) {
            return res.status(400).json({
                message:
                    'No active subscription. Please subscribe to a monthly plan first.'
            });
        }

        const estimatedValue =
            await rideService.getEstimatedValue(
                pickup,
                destination,
                subscription.plan.vehicleType
            );

        return res.status(200).json({
            estimatedValue,
            vehicleType: subscription.plan.vehicleType,
            ridesRemaining: subscription.ridesRemaining
        });
    } catch (err) {
        console.error('GET ESTIMATED VALUE ERROR:', err);

        return res.status(500).json({
            message: err.message
        });
    }
};

// CONFIRM RIDE — CAPTAIN ACCEPTS THE RIDE
module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    if (!req.captain?._id) {
        return res.status(401).json({
            message: 'Captain authentication required.'
        });
    }

    const { rideId } = req.body;

    if (!rideId) {
        return res.status(400).json({
            message: 'Ride ID is required.'
        });
    }

    try {
        const ride = await rideService.confirmRide({
            rideId,
            captain: req.captain
        });

        const userSocketId = ride.user?.socketId;

        console.log('RIDE CONFIRMED:', ride._id);
        console.log('USER SOCKET ID:', userSocketId);

        if (userSocketId) {
            const sent = sendMessageToSocketId(userSocketId, {
                event: 'ride-confirmed',
                data: ride
            });

            console.log(
                sent
                    ? 'RIDE-CONFIRMED SENT'
                    : 'RIDE-CONFIRMED FAILED'
            );
        } else {
            console.error('USER SOCKET ID IS MISSING');
        }

        return res.status(200).json(ride);
    } catch (err) {
        console.error('CONFIRM RIDE ERROR:', err);

        return res.status(500).json({
            message: err.message
        });
    }
};

// START RIDE — CAPTAIN SUBMITS OTP
module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    if (!req.captain?._id) {
        return res.status(401).json({
            message: 'Captain authentication required.'
        });
    }

    const { rideId, otp } = req.query;

    if (!rideId || !otp) {
        return res.status(400).json({
            message: 'Ride ID and OTP are required.'
        });
    }

    try {
        const ride = await rideService.startRide({
            rideId,
            otp,
            captain: req.captain
        });

        console.log('RIDE STARTED:', ride._id);

        if (ride.user?.socketId) {
            const sent = sendMessageToSocketId(
                ride.user.socketId,
                {
                    event: 'ride-started',
                    data: ride
                }
            );

            console.log(
                sent
                    ? 'RIDE-STARTED SENT TO USER'
                    : 'RIDE-STARTED FAILED'
            );
        } else {
            console.error('USER SOCKET ID MISSING');
        }

        return res.status(200).json(ride);
    } catch (err) {
        console.error('START RIDE ERROR:', err);

        return res.status(500).json({
            message: err.message
        });
    }
};

// END RIDE
module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    if (!req.captain?._id) {
        return res.status(401).json({
            message: 'Captain authentication required.'
        });
    }

    const { rideId } = req.body;

    if (!rideId) {
        return res.status(400).json({
            message: 'Ride ID is required.'
        });
    }

    try {
        const ride = await rideService.endRide({
            rideId,
            captain: req.captain
        });

        if (ride.user?.socketId) {
            sendMessageToSocketId(ride.user.socketId, {
                event: 'ride-ended',
                data: ride
            });
        }

        return res.status(200).json(ride);
    } catch (err) {
        console.error('END RIDE ERROR:', err);

        return res.status(500).json({
            message: err.message
        });
    }
};

// CANCEL RIDE
module.exports.cancelRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    if (!req.user?._id) {
        return res.status(401).json({
            message: 'User authentication required.'
        });
    }

    const { rideId } = req.body;

    if (!rideId) {
        return res.status(400).json({
            message: 'Ride ID is required.'
        });
    }

    try {
        const ride = await rideService.cancelRide({
            rideId,
            user: req.user
        });

        if (ride.captain?.socketId) {
            sendMessageToSocketId(ride.captain.socketId, {
                event: 'ride-cancelled',
                data: ride
            });
        }

        return res.status(200).json(ride);
    } catch (err) {
        console.error('CANCEL RIDE ERROR:', err);

        return res.status(400).json({
            message: err.message
        });
    }
};

         

