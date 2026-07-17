const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: [ 'Basic', 'Standard', 'Premium' ],
        unique: true
    },

    description: {
        type: String,
        default: ''
    },

    pricePerMonth: {
        type: Number,
        required: true,
        min: [ 0, 'Price cannot be negative' ]
    },

    ridesPerMonth: {
        type: Number,
        required: true,
        min: [ 1, 'Plan must include at least 1 pickup & drop per month' ]
    },

    vehicleType: {
        type: String,
        required: true,
        enum: [ 'auto', 'car', 'moto' ]
    },

    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('plan', planSchema);
