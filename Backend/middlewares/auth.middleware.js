const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blacklistToken.model');
const captainModel = require('../models/captain.model');


module.exports.authUser = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }


    const isBlacklisted = await blackListTokenModel.findOne({ token: token });

    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id)

        req.user = user;

        return next();

    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}
module.exports.authCaptain = async (req, res, next) => {

    try {

        const token =
            req.cookies.token ||
            req.headers.authorization?.split(' ')[1];


        console.log('');
        console.log('======================================');
        console.log('🔐 CAPTAIN AUTH');
        console.log('Token exists:', !!token);


        if (!token) {

            console.log('❌ CAPTAIN TOKEN MISSING');

            return res.status(401).json({
                message: 'Captain token missing'
            });
        }


        const isBlacklisted =
            await blackListTokenModel.findOne({
                token
            });


        if (isBlacklisted) {

            console.log('❌ CAPTAIN TOKEN BLACKLISTED');

            return res.status(401).json({
                message: 'Token blacklisted'
            });
        }


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        console.log(
            '✅ JWT VERIFIED:',
            decoded
        );


        const captain =
            await captainModel.findById(
                decoded._id
            );


        if (!captain) {

            console.log(
                '❌ CAPTAIN NOT FOUND:',
                decoded._id
            );

            return res.status(401).json({
                message: 'Captain not found'
            });
        }


        req.captain = captain;


        console.log(
            '✅ CAPTAIN AUTHENTICATED:',
            captain._id
        );

        console.log('======================================');


        next();

    } catch (err) {

        console.error(
            '❌ CAPTAIN AUTH ERROR:',
            err.message
        );

        return res.status(401).json({
            message: 'Unauthorized'
        });

    }
};

