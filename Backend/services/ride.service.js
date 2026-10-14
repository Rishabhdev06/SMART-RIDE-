const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const subscriptionService = require('./subscription.service');
const crypto = require('crypto');

async function getEstimatedValue(pickup, destination, vehicleType) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);

    const baseValue = { auto: 30, car: 50, moto: 20 };
    const perKmRate = { auto: 10, car: 15, moto: 8 };
    const perMinuteRate = { auto: 2, car: 3, moto: 1.5 };

    return Math.round(
        baseValue[vehicleType] +
        (distanceTime.distance.value / 1000) * perKmRate[vehicleType] +
        (distanceTime.duration.value / 60) * perMinuteRate[vehicleType]
    );
}

module.exports.getEstimatedValue = getEstimatedValue;

function getOtp(num) {
    return crypto.randomInt(
        Math.pow(10, num - 1),
        Math.pow(10, num)
    ).toString();
}

module.exports.createRide = async ({ user, pickup, destination }) => {
    if (!user || !pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const subscription = await subscriptionService.consumeRide(user);
    const vehicleType = subscription.plan.vehicleType;

    let estimatedValue;

    try {
        estimatedValue = await getEstimatedValue(
            pickup,
            destination,
            vehicleType
        );
    } catch (err) {
        console.error('ESTIMATED VALUE ERROR:', err.message);
        estimatedValue = undefined;
    }

    try {
        const otp = getOtp(6);

        const ride = await rideModel.create({
            user,
            subscription: subscription._id,
            pickup,
            destination,
            vehicleType,
            estimatedValue,
            otp
        });

        return ride;
    } catch (err) {
        await subscriptionService.refundRide(subscription._id);
        throw err;
    }
};

module.exports.confirmRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride ID is required');
    }

    if (!captain) {
        throw new Error('Captain is required');
    }

    console.log('CONFIRMING RIDE:', rideId);
    console.log('CAPTAIN ID:', captain._id);

    const existingRide = await rideModel
        .findById(rideId)
        .select('_id status captain');

    console.log('EXISTING RIDE:', existingRide);
    console.log('DATABASE:', rideModel.db.name);
    console.log('COLLECTION:', rideModel.collection.name);

    if (!existingRide) {
        throw new Error('Ride not found');
    }

    if (existingRide.status !== 'pending') {
        throw new Error(
            `Ride cannot be accepted. Current status: ${existingRide.status}`
        );
    }

    const updatedRide = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            status: 'pending'
        },
        {
            status: 'accepted',
            captain: captain._id
        },
        {
            new: true
        }
    );

    if (!updatedRide) {
        throw new Error(
            'Ride not found or ride has already been accepted'
        );
    }

    const ride = await rideModel
        .findById(rideId)
        .populate('user')
        .populate('captain')
        .populate('subscription')
        .select('+otp');

    if (!ride) {
        throw new Error('Ride not found after confirmation');
    }

    console.log('RIDE CONFIRMED:', ride._id);
    console.log('USER SOCKET ID:', ride.user?.socketId);

    return ride;
};

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride ID and OTP are required');
    }

    if (!captain) {
        throw new Error('Captain is required');
    }

    const ride = await rideModel
        .findOne({
            _id: rideId,
            captain: captain._id
        })
        .populate('user')
        .populate('captain')
        .populate('subscription')
        .select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (String(ride.otp) !== String(otp).trim()) {
        throw new Error('Invalid OTP');
    }

    const updatedRide = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            captain: captain._id,
            status: 'accepted',
            otp: ride.otp
        },
        {
            status: 'ongoing'
        },
        {
            new: true
        }
    )
        .populate('user')
        .populate('captain')
        .populate('subscription')
        .select('+otp');

    if (!updatedRide) {
        throw new Error('Ride could not be started');
    }

    return updatedRide;
};

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride ID is required');
    }

    if (!captain) {
        throw new Error('Captain is required');
    }

    const ride = await rideModel
        .findOne({
            _id: rideId,
            captain: captain._id
        })
        .populate('user')
        .populate('captain')
        .populate('subscription');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    const updatedRide = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            captain: captain._id,
            status: 'ongoing'
        },
        {
            status: 'completed'
        },
        {
            new: true
        }
    )
        .populate('user')
        .populate('captain')
        .populate('subscription');

    if (!updatedRide) {
        throw new Error('Ride could not be completed');
    }

    return updatedRide;
};

module.exports.cancelRide = async ({ rideId, user }) => {
    if (!rideId) {
        throw new Error('Ride ID is required');
    }

    if (!user) {
        throw new Error('User is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        user: user._id
    });

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (!['pending', 'accepted'].includes(ride.status)) {
        throw new Error('Ride can no longer be cancelled');
    }

    ride.status = 'cancelled';
    await ride.save();

    await subscriptionService.refundRide(ride.subscription);

    return ride;
};
