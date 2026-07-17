const mongoose = require('mongoose');


const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
    },

    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subscription',
        required: true
    },

    pickup: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },

    vehicleType: {
        type: String,
        enum: [ 'auto', 'car', 'moto' ],
        required: true
    },

    // Estimated value of this pickup & drop for reporting purposes only.
    // Not charged separately - it is covered by the user's monthly subscription.
    estimatedValue: {
        type: Number,
    },

    status: {
        type: String,
        enum: [ 'pending', 'accepted', "ongoing", 'completed', 'cancelled' ],
        default: 'pending',
    },

    duration: {
        type: Number,
    }, // in seconds

    distance: {
        type: Number,
    }, // in meters

    otp: {
        type: String,
        select: false,
        required: true,
    },
})

module.exports = mongoose.model('ride', rideSchema);
