const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const subscriptionService = require('./subscription.service');
const crypto = require('crypto');

// Rough, informational-only value estimate for a pickup & drop, shown to the
// user for reference. It is never charged - the ride is covered by the
// user's active monthly subscription.
async function getEstimatedValue(pickup, destination, vehicleType) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);

    const baseValue = {
        auto: 30,
        car: 50,
        moto: 20
    };

    const perKmRate = {
        auto: 10,
        car: 15,
        moto: 8
    };

    const perMinuteRate = {
        auto: 2,
        car: 3,
        moto: 1.5
    };

    const value = Math.round(
        baseValue[ vehicleType ]
        + ((distanceTime.distance.value / 1000) * perKmRate[ vehicleType ])
        + ((distanceTime.duration.value / 60) * perMinuteRate[ vehicleType ])
    );

    return value;
}

module.exports.getEstimatedValue = getEstimatedValue;

function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}


module.exports.createRide = async ({
    user, pickup, destination
}) => {
    if (!user || !pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    // Requires - and consumes one ride from - the user's active monthly subscription.
    const subscription = await subscriptionService.consumeRide(user);
    const vehicleType = subscription.plan.vehicleType;

    let estimatedValue;
    try {
        estimatedValue = await getEstimatedValue(pickup, destination, vehicleType);
    } catch (err) {
        estimatedValue = undefined;
    }

    try {
        const ride = await rideModel.create({
            user,
            subscription: subscription._id,
            pickup,
            destination,
            vehicleType,
            estimatedValue,
            otp: getOtp(6)
        })

        return ride;
    } catch (err) {
        // Roll back the quota deduction if ride creation failed for any reason.
        await subscriptionService.refundRide(subscription._id);
        throw err;
    }
}

module.exports.confirmRide = async ({
    rideId, captain
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'accepted',
        captain: captain._id
    })

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').populate('subscription').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;

}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').populate('subscription').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    })

    return ride;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').populate('subscription').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    })

    return ride;
}

module.exports.cancelRide = async ({ rideId, user }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({ _id: rideId, user: user._id });

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (![ 'pending', 'accepted' ].includes(ride.status)) {
        throw new Error('Ride can no longer be cancelled');
    }

    ride.status = 'cancelled';
    await ride.save();

    // Give the ride back to the user's monthly quota since it never happened.
    await subscriptionService.refundRide(ride.subscription);

    return ride;
}
