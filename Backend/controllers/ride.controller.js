const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const subscriptionService = require('../services/subscription.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');


module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Please log in again.' });
    }

    const { pickup, destination } = req.body;

    let ride;
    try {
        ride = await rideService.createRide({ user: req.user._id, pickup, destination });
        res.status(201).json(ride);
    } catch (err) {
        console.error('❌ CREATE RIDE ERROR:', err);
        return res.status(400).json({ message: err.message });
    }

    // Notifying nearby captains happens after the response is already sent,
    // so any failure here must never crash the process - just log it.
    try {
        console.log('');
        console.log('======================================');
        console.log('🚕 NEW RIDE CREATED');
        console.log('Ride ID:', ride._id);
        console.log('Pickup:', pickup);
        console.log('Destination:', destination);
        console.log('======================================');

        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        console.log('📍 Pickup coordinates:', pickupCoordinates);

        const captainsInRadius = await mapService.getCaptainsInTheRadius(pickupCoordinates.ltd, pickupCoordinates.lng, 2);
        console.log('🚕 Captains within 2 KM:', captainsInRadius.length);

        const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user').populate('subscription');

        if (!rideWithUser) {
            console.log('❌ Could not reload ride with user/subscription populated');
            return;
        }

        rideWithUser.otp = "";

        if (!captainsInRadius.length) {
            console.log('❌ No captains found within 2 KM');
            return;
        }

        captainsInRadius.forEach(captain => {
            console.log('');
            console.log('Captain:', captain._id);
            console.log('Captain socket:', captain.socketId);

            if (!captain.socketId) {
                console.log('❌ Captain has no socket ID');
                return;
            }

            sendMessageToSocketId(captain.socketId, {
                event: 'new-ride',
                data: rideWithUser
            });

            console.log('✅ NEW RIDE SENT TO CAPTAIN');
        });

    } catch (notifyErr) {
        console.error('❌ Failed to notify captains:', notifyErr);
    }
};

module.exports.getEstimatedValue = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const subscription = await subscriptionService.getActiveSubscription(req.user._id);
        if (!subscription) {
            return res.status(400).json({ message: 'No active subscription. Please subscribe to a monthly plan first.' });
        }

        const estimatedValue = await rideService.getEstimatedValue(pickup, destination, subscription.plan.vehicleType);
        return res.status(200).json({ estimatedValue, vehicleType: subscription.plan.vehicleType, ridesRemaining: subscription.ridesRemaining });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
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


        console.log('');
        console.log(
            '======================================'
        );

        console.log(
            '🚕 CAPTAIN CONFIRMED RIDE'
        );

        console.log(
            'Ride ID:',
            ride._id
        );

        console.log(
            'User ID:',
            ride.user?._id
        );

        console.log(
            'USER SOCKET ID:',
            ride.user?.socketId
        );

        console.log(
            'Captain ID:',
            ride.captain?._id
        );

        console.log(
            'OTP:',
            ride.otp
        );

        console.log(
            '======================================'
        );


        if (!ride.user?.socketId) {

            console.log(
                '❌ USER SOCKET ID IS MISSING'
            );

        } else {

            const sent =
                sendMessageToSocketId(
                    ride.user.socketId,
                    {
                        event: 'ride-confirmed',
                        data: ride
                    }
                );


            if (sent) {

                console.log(
                    '✅ RIDE-CONFIRMED SENT TO USER'
                );

            } else {

                console.log(
                    '❌ RIDE-CONFIRMED COULD NOT BE SENT'
                );

            }

        }


        return res.status(200).json(ride);


    } catch (err) {

        console.error(
            '❌ CONFIRM RIDE ERROR:',
            err
        );


        return res.status(500).json({
            message: err.message
        });

    }

};

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        if (ride.user && ride.user.socketId) {
            sendMessageToSocketId(ride.user.socketId, {
                event: 'ride-started',
                data: ride
            });
        }

        return res.status(200).json(ride);
    } catch (err) {
        console.error('❌ START RIDE ERROR:', err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        if (ride.user && ride.user.socketId) {
            sendMessageToSocketId(ride.user.socketId, {
                event: 'ride-ended',
                data: ride
            });
        }

        return res.status(200).json(ride);
    } catch (err) {
        console.error('❌ END RIDE ERROR:', err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports.cancelRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.cancelRide({ rideId, user: req.user });

        if (ride.captain && ride.captain.socketId) {
            sendMessageToSocketId(ride.captain.socketId, {
                event: 'ride-cancelled',
                data: ride
            });
        }

        return res.status(200).json(ride);
    } catch (err) {
        console.error('❌ CANCEL RIDE ERROR:', err);
        return res.status(400).json({ message: err.message });
    }
};

        
     

         

