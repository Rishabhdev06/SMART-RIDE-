const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const subscriptionService = require('./subscription.service');
const crypto = require('crypto');


// ======================================================
// GET ESTIMATED VALUE
// ======================================================

async function getEstimatedValue(
    pickup,
    destination,
    vehicleType
) {

    if (!pickup || !destination) {
        throw new Error(
            'Pickup and destination are required'
        );
    }


    const distanceTime =
        await mapService.getDistanceTime(
            pickup,
            destination
        );


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

        baseValue[vehicleType]

        +

        (
            (distanceTime.distance.value / 1000)
            *
            perKmRate[vehicleType]
        )

        +

        (
            (distanceTime.duration.value / 60)
            *
            perMinuteRate[vehicleType]
        )

    );


    return value;
}


module.exports.getEstimatedValue =
    getEstimatedValue;


// ======================================================
// GENERATE OTP
// ======================================================

function getOtp(num) {

    const otp =
        crypto.randomInt(
            Math.pow(10, num - 1),
            Math.pow(10, num)
        ).toString();

    return otp;
}


// ======================================================
// CREATE RIDE
// ======================================================

module.exports.createRide = async ({
    user,
    pickup,
    destination
}) => {

    if (!user || !pickup || !destination) {

        throw new Error(
            'Pickup and destination are required'
        );

    }


    // Consume one ride from active subscription

    const subscription =
        await subscriptionService.consumeRide(
            user
        );


    const vehicleType =
        subscription.plan.vehicleType;


    let estimatedValue;


    try {

        estimatedValue =
            await getEstimatedValue(
                pickup,
                destination,
                vehicleType
            );

    } catch (err) {

        console.error(
            '⚠️ ESTIMATED VALUE ERROR:',
            err.message
        );

        estimatedValue = undefined;

    }


    try {

        // IMPORTANT:
        // OTP is generated HERE when the ride is created.

        const otp = getOtp(6);


        console.log('');
        console.log(
            '======================================'
        );

        console.log(
            '🚕 CREATING RIDE'
        );

        console.log(
            'OTP GENERATED:',
            otp
        );

        console.log(
            '======================================'
        );


        const ride =
            await rideModel.create({

                user,

                subscription:
                    subscription._id,

                pickup,

                destination,

                vehicleType,

                estimatedValue,

                otp

            });


        return ride;


    } catch (err) {

        // Refund ride quota if creation fails

        await subscriptionService.refundRide(
            subscription._id
        );

        throw err;

    }

};


// ======================================================
// CONFIRM RIDE
// ======================================================

module.exports.confirmRide = async ({
    rideId,
    captain
}) => {

    if (!rideId) {

        throw new Error(
            'Ride ID is required'
        );

    }


    if (!captain) {

        throw new Error(
            'Captain is required'
        );

    }


    console.log('');
    console.log(
        '======================================'
    );

    console.log(
        '🚕 CONFIRMING RIDE'
    );

    console.log(
        'Ride ID:',
        rideId
    );

    console.log(
        'Captain ID:',
        captain._id
    );

    console.log(
        '======================================'
    );


    // Accept only a pending ride

    const updatedRide =
        await rideModel.findOneAndUpdate(

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


    // IMPORTANT:
    // otp has select:false in ride.model.js.
    // Therefore +otp is REQUIRED.

    const ride =
        await rideModel
            .findById(rideId)
            .populate('user')
            .populate('captain')
            .populate('subscription')
            .select('+otp');


    if (!ride) {

        throw new Error(
            'Ride not found after confirmation'
        );

    }


    console.log('');
    console.log(
        '======================================'
    );

    console.log(
        '✅ RIDE CONFIRMED'
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
        'User Socket ID:',
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


    return ride;

};


// ======================================================
// START RIDE
// ======================================================

module.exports.startRide = async ({
    rideId,
    otp,
    captain
}) => {

    if (!rideId || !otp) {

        throw new Error(
            'Ride id and OTP are required'
        );

    }


    if (!captain) {

        throw new Error(
            'Captain is required'
        );

    }


    const ride =
        await rideModel
            .findOne({
                _id: rideId,

                captain: captain._id
            })
            .populate('user')
            .populate('captain')
            .populate('subscription')
            .select('+otp');


    if (!ride) {

        throw new Error(
            'Ride not found'
        );

    }


    if (ride.status !== 'accepted') {

        throw new Error(
            'Ride not accepted'
        );

    }


    if (ride.otp !== otp) {

        throw new Error(
            'Invalid OTP'
        );

    }


    await rideModel.findOneAndUpdate(

        {
            _id: rideId
        },

        {
            status: 'ongoing'
        }

    );


    ride.status = 'ongoing';


    return ride;

};


// ======================================================
// END RIDE
// ======================================================

module.exports.endRide = async ({
    rideId,
    captain
}) => {

    if (!rideId) {

        throw new Error(
            'Ride id is required'
        );

    }


    if (!captain) {

        throw new Error(
            'Captain is required'
        );

    }


    const ride =
        await rideModel
            .findOne({
                _id: rideId,

                captain: captain._id
            })
            .populate('user')
            .populate('captain')
            .populate('subscription')
            .select('+otp');


    if (!ride) {

        throw new Error(
            'Ride not found'
        );

    }


    if (ride.status !== 'ongoing') {

        throw new Error(
            'Ride not ongoing'
        );

    }


    await rideModel.findOneAndUpdate(

        {
            _id: rideId
        },

        {
            status: 'completed'
        }

    );


    ride.status = 'completed';


    return ride;

};


// ======================================================
// CANCEL RIDE
// ======================================================

module.exports.cancelRide = async ({
    rideId,
    user
}) => {

    if (!rideId) {

        throw new Error(
            'Ride id is required'
        );

    }


    if (!user) {

        throw new Error(
            'User is required'
        );

    }


    const ride =
        await rideModel.findOne({

            _id: rideId,

            user: user._id

        });


    if (!ride) {

        throw new Error(
            'Ride not found'
        );

    }


    if (
        ![
            'pending',
            'accepted'
        ].includes(ride.status)
    ) {

        throw new Error(
            'Ride can no longer be cancelled'
        );

    }


    ride.status = 'cancelled';

    await ride.save();


    // Return the ride to monthly quota

    await subscriptionService.refundRide(
        ride.subscription
    );


    return ride;

};
