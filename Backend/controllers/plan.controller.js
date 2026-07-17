const planService = require('../services/plan.service');

module.exports.getPlans = async (req, res) => {
    try {
        const plans = await planService.getAllPlans();
        res.status(200).json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports.getPlanById = async (req, res) => {
    try {
        const plan = await planService.getPlanById(req.params.planId);
        res.status(200).json(plan);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}
