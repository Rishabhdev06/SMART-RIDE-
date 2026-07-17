const planModel = require('../models/plan.model');

const DEFAULT_PLANS = [
    {
        name: 'Basic',
        description: 'Great for occasional commuters who need a handful of reliable pickups & drops every month.',
        pricePerMonth: 1499,
        ridesPerMonth: 20,
        vehicleType: 'auto'
    },
    {
        name: 'Standard',
        description: 'Our most popular plan - daily pickup & drop in a comfortable car, all month long.',
        pricePerMonth: 3499,
        ridesPerMonth: 45,
        vehicleType: 'car'
    },
    {
        name: 'Premium',
        description: 'Unlimited-feel commuting with priority captains and two rides a day, every day.',
        pricePerMonth: 5999,
        ridesPerMonth: 60,
        vehicleType: 'car'
    }
];

module.exports.getAllPlans = async () => {
    return planModel.find({ isActive: true }).sort({ pricePerMonth: 1 });
}

module.exports.getPlanById = async (planId) => {
    if (!planId) {
        throw new Error('Plan id is required');
    }
    const plan = await planModel.findById(planId);
    if (!plan) {
        throw new Error('Plan not found');
    }
    return plan;
}

// Idempotently seeds the three default plans if the collection is empty.
// Called at server start so the platform is usable without a manual admin step.
module.exports.ensureDefaultPlans = async () => {
    const existingCount = await planModel.countDocuments();
    if (existingCount > 0) {
        return;
    }
    await planModel.insertMany(DEFAULT_PLANS);
    console.log('Seeded default subscription plans (Basic, Standard, Premium)');
}
