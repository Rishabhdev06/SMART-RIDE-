const subscriptionService = require('../services/subscription.service');
const { validationResult } = require('express-validator');

module.exports.subscribe = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { planId } = req.body;

    try {
        const subscription = await subscriptionService.subscribeToPlan({ userId: req.user._id, planId });
        res.status(201).json(subscription);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports.getMySubscription = async (req, res) => {
    try {
        const subscription = await subscriptionService.getActiveSubscription(req.user._id);
        res.status(200).json(subscription);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports.cancelMySubscription = async (req, res) => {
    try {
        const subscription = await subscriptionService.cancelSubscription(req.user._id);
        res.status(200).json(subscription);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
