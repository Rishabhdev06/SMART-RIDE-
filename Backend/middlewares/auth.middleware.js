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

const jwt = require('jsonwebtoken');
const captainModel = require('../models/captain.model');
const blackListTokenModel = require('../models/blackListToken.model');

module.exports.authCaptain = async (req, res, next) => {

    try {

        // ==================================================
        // GET TOKEN
        // ==================================================

        const authHeader =
            req.headers.authorization;

        let token = null;


        if (authHeader && authHeader.startsWith('Bearer ')) {

            token =
                authHeader.split(' ')[1];

        }


        // Also support cookie token

        if (!token && req.cookies?.token) {

            token =
                req.cookies.token;

        }


        console.log('');
        console.log('======================================');
        console.log('🔐 CAPTAIN AUTHENTICATION');
        console.log(
            'Authorization header exists:',
            !!authHeader
        );
        console.log(
            'Token exists:',
            !!token
        );
        console.log('======================================');


        // ==================================================
        // NO TOKEN
        // ==================================================

        if (!token) {

            console.log(
                '❌ CAPTAIN TOKEN MISSING'
            );

            return res.status(401).json({
                message: 'Captain token missing'
            });

        }


        // ==================================================
        // CHECK BLACKLIST
        // ==================================================

        const isBlacklisted =
            await blackListTokenModel.findOne({
                token: token
            });


        if (isBlacklisted) {

            console.log(
                '❌ CAPTAIN TOKEN IS BLACKLISTED'
            );

            return res.status(401).json({
                message: 'Token has been logged out'
            });

        }


        // ==================================================
        // VERIFY JWT
        // ==================================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        console.log(
            '✅ JWT VERIFIED'
        );

        console.log(
            'Decoded token:',
            decoded
        );


        // ==================================================
        // FIND CAPTAIN
        // ==================================================

        const captain =
            await captainModel.findById(
                decoded._id
            );


        if (!captain) {

            console.log(
                '❌ CAPTAIN NOT FOUND FOR JWT ID:',
                decoded._id
            );

            return res.status(401).json({
                message:
                    'Captain account not found'
            });

        }


        // ==================================================
        // SUCCESS
        // ==================================================

        req.captain = captain;


        console.log(
            '✅ CAPTAIN AUTHENTICATED'
        );

        console.log(
            'Captain ID:',
            captain._id
        );

        console.log(
            'Captain name:',
            captain.fullname?.firstname
        );

        console.log('======================================');


        return next();


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
