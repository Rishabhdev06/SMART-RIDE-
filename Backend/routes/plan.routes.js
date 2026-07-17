const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const planController = require('../controllers/plan.controller');

router.get('/', planController.getPlans);

router.get('/:planId',
    param('planId').isMongoId().withMessage('Invalid plan id'),
    planController.getPlanById
);

module.exports = router;
