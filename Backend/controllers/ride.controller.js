const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const subscriptionService = require('../services/subscription.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');


// ======================================================
// CREATE RIDE
// ======================================================
module.exports.createRide = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const { pickup, destination } = req.body;

    try {

        // Create ride
        const ride = await rideService.createRide({
            user: req.user._id,
            pickup,
            destination
        });

        // Send response to user immediately
        res.status(201).json(ride);


        // ==================================================
        // FIND NEARBY CAPTAINS AND SEND NEW RIDE
        // ==================================================

        try {

            console.log('');
            console.log('==========================================');
            console.log('🚕 SEARCHING FOR CAPTAINS');
            console.log('Ride ID:', ride._id);
            console.log('Pickup:', pickup);
            console.log('==========================================');


            // Convert pickup address into coordinates
            const pickupCoordinates =
                await mapService.getAddressCoordinate(pickup);

            console.log('📍 PICKUP COORDINATES:', pickupCoordinates);


            // Find captains within 2 KM
            const captainsInRadius =
                await mapService.getCaptainsInTheRadius(
                    pickupCoordinates.ltd,
                    pickupCoordinates.lng,
                    2
                );


            console.log(
                '🚕 CAPTAINS FOUND:',
                captainsInRadius.length
            );


            // Print captain information
            captainsInRadius.forEach(captain => {

                console.log('------------------------------------------');

                console.log('Captain ID:', captain._id);
                console.log('Captain socket ID:', captain.socketId);
                console.log('Captain location:', captain.location);

            });


            // Get complete ride information
            const rideWithUser =
                await rideModel
                    .findOne({ _id: ride._id })
                    .populate('user')
                    .populate('subscription');


            // No captain nearby
            if (!captainsInRadius.length) {

                console.log(
                    `❌ No captains found within 2 KM for ride ${ride._id}`
                );

            }


            // Send notification to every nearby captain
            captainsInRadius.forEach(captain => {

                if (!captain.socketId) {

                    console.log(
                        `❌ Captain ${captain._id} has NO socket ID`
                    );

                    return;
                }


                console.log('');
                console.log('📨 SENDING NEW RIDE');
                console.log('Captain:', captain._id);
                console.log('Socket:', captain.socketId);


                sendMessageToSocketId(
                    captain.socketId,
                    {
                        event: 'new-ride',
                        data: rideWithUser
                    }
                );


                console.log('✅ NEW RIDE SENT');

            });


            console.log('==========================================');
            console.log('🚕 CAPTAIN SEARCH FINISHED');
            console.log('==========================================');
            console.log('');

        } catch (notifyError) {

            console.error(
                '❌ ERROR WHILE NOTIFYING CAPTAINS:',
                notifyError
            );

        }

    } catch (err) {

        console.error('❌ CREATE RIDE ERROR:', err);

        return res.status(400).json({
            message: err.message
        });

    }
};


// ======================================================
// GET ESTIMATED VALUE
// ======================================================
module.exports.getEstimatedValue = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({
            errors: errors.array()
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

            vehicleType:
                subscription.plan.vehicleType,

            ridesRemaining:
                subscription.ridesRemaining

        });

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

    }
};


// ======================================================
// CONFIRM RIDE
// ======================================================
module.exports.confirmRide = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({
            errors: errors.array()
        });

    }

    const { rideId } = req.body;

    try {

        const ride =
            await rideService.confirmRide({
                rideId,
                captain: req.captain
            });


        console.log(
            '✅ RIDE CONFIRMED BY CAPTAIN:',
            req.captain._id
        );


        // Notify user
        if (ride.user && ride.user.socketId) {

            sendMessageToSocketId(
                ride.user.socketId,
                {
                    event: 'ride-confirmed',
                    data: ride
                }
            );

        }


        return res.status(200).json(ride);

    } catch (err) {

        console.error('❌ CONFIRM RIDE ERROR:', err);

        return res.status(500).json({
            message: err.message
        });

    }
};


// ======================================================
// START RIDE
// ======================================================
module.exports.startRide = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({
            errors: errors.array()
        });

    }

    const { rideId, otp } = req.query;

    try {

        const ride =
            await rideService.startRide({
                rideId,
                otp,
                captain: req.captain
            });


        if (ride.user && ride.user.socketId) {

            sendMessageToSocketId(
                ride.user.socketId,
                {
                    event: 'ride-started',
                    data: ride
                }
            );

        }


        return res.status(200).json(ride);

    } catch (err) {

        console.error('❌ START RIDE ERROR:', err);

        return res.status(500).json({
            message: err.message
        });

    }
};


// ======================================================
// END RIDE
// ======================================================
module.exports.endRide = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({
            errors: errors.array()
        });

    }

    const { rideId } = req.body;

    try {

        const ride =
            await rideService.endRide({
                rideId,
                captain: req.captain
            });


        if (ride.user && ride.user.socketId) {

            sendMessageToSocketId(
                ride.user.socketId,
                {
                    event: 'ride-ended',
                    data: ride
                }
            );

        }


        return res.status(200).json(ride);

    } catch (err) {

        console.error('❌ END RIDE ERROR:', err);

        return res.status(500).json({
            message: err.message
        });

    }
};


// ======================================================
// CANCEL RIDE
// ======================================================
module.exports.cancelRide = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({
            errors: errors.array()
        });

    }

    const { rideId } = req.body;

    try {

        const ride =
            await rideService.cancelRide({
                rideId,
                user: req.user
            });


        if (ride.captain && ride.captain.socketId) {

            sendMessageToSocketId(
                ride.captain.socketId,
                {
                    event: 'ride-cancelled',
                    data: ride
                }
            );

        }


        return res.status(200).json(ride);

    } catch (err) {

        console.error('❌ CANCEL RIDE ERROR:', err);

        return res.status(400).json({
            message: err.message
        });

    }
};
