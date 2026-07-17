const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'plan',
        required: true
    },

    startDate: {
        type: Date,
        default: Date.now
    },

    endDate: {
        type: Date,
        required: true
    },

    ridesAllotted: {
        type: Number,
        required: true
    },

    ridesUsed: {
        type: Number,
        default: 0
    },

    ridesRemaining: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: [ 'active', 'expired', 'cancelled' ],
        default: 'active'
    }
});

subscriptionSchema.methods.isUsable = function () {
    return this.status === 'active' && this.endDate > new Date() && this.ridesRemaining > 0;
};

module.exports = mongoose.model('subscription', subscriptionSchema);
