const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/subscribe',
    authMiddleware.authUser,
    body('planId').isMongoId().withMessage('Invalid plan id'),
    subscriptionController.subscribe
);

router.get('/me',
    authMiddleware.authUser,
    subscriptionController.getMySubscription
);

router.post('/cancel',
    authMiddleware.authUser,
    subscriptionController.cancelMySubscription
);

module.exports = router;
