const subscriptionModel = require('../models/subscription.model');
const planModel = require('../models/plan.model');

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

module.exports.getActiveSubscription = async (userId) => {
    if (!userId) {
        throw new Error('User id is required');
    }

    const subscription = await subscriptionModel.findOne({
        user: userId,
        status: 'active'
    }).populate('plan');

    if (!subscription) {
        return null;
    }

    // Lazily expire subscriptions whose validity window has passed.
    if (subscription.endDate <= new Date() && subscription.status === 'active') {
        subscription.status = 'expired';
        await subscription.save();
        return null;
    }

    return subscription;
}

module.exports.subscribeToPlan = async ({ userId, planId }) => {
    if (!userId || !planId) {
        throw new Error('User id and plan id are required');
    }

    const plan = await planModel.findById(planId);
    if (!plan || !plan.isActive) {
        throw new Error('Plan not found');
    }

    const existingActive = await module.exports.getActiveSubscription(userId);
    if (existingActive) {
        throw new Error('You already have an active subscription. Cancel it before subscribing to a new plan.');
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + ONE_MONTH_MS);

    const subscription = await subscriptionModel.create({
        user: userId,
        plan: plan._id,
        startDate,
        endDate,
        ridesAllotted: plan.ridesPerMonth,
        ridesUsed: 0,
        ridesRemaining: plan.ridesPerMonth,
        status: 'active'
    });

    return subscriptionModel.findById(subscription._id).populate('plan');
}

module.exports.cancelSubscription = async (userId) => {
    const subscription = await module.exports.getActiveSubscription(userId);
    if (!subscription) {
        throw new Error('No active subscription found');
    }

    subscription.status = 'cancelled';
    await subscription.save();

    return subscription;
}

// Deducts one ride from the caller's active subscription. Throws if there is
// no usable subscription (none active, expired, or quota exhausted).
module.exports.consumeRide = async (userId) => {
    const subscription = await module.exports.getActiveSubscription(userId);

    if (!subscription) {
        throw new Error('No active subscription. Please subscribe to a monthly plan to book a pickup & drop.');
    }

    if (subscription.ridesRemaining <= 0) {
        throw new Error('You have used all the pickups & drops included in your plan this month.');
    }

    subscription.ridesUsed += 1;
    subscription.ridesRemaining -= 1;
    await subscription.save();

    return subscription;
}

// Restores one ride to the subscription's quota, used when a ride is cancelled.
module.exports.refundRide = async (subscriptionId) => {
    if (!subscriptionId) return;

    const subscription = await subscriptionModel.findById(subscriptionId);
    if (!subscription) return;

    subscription.ridesUsed = Math.max(0, subscription.ridesUsed - 1);
    subscription.ridesRemaining += 1;
    await subscription.save();
}
