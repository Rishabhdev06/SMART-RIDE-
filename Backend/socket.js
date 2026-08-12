const socketIo = require('socket.io');

const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;


// ======================================================
// ALLOWED ORIGINS
// ======================================================

const allowedOrigins = (process.env.CLIENT_URL || '*')
    .split(',')
    .map(origin =>
        origin.trim().replace(/\/$/, '')
    );


// ======================================================
// INITIALIZE SOCKET
// ======================================================

function initializeSocket(server) {

    io = socketIo(server, {

        cors: {

            origin: (origin, callback) => {

                // Allow requests without an origin
                // and allow all origins when CLIENT_URL = *

                if (
                    !origin ||
                    allowedOrigins.includes('*') ||
                    allowedOrigins.includes(
                        origin.replace(/\/$/, '')
                    )
                ) {

                    callback(null, true);

                } else {

                    console.log(
                        '❌ SOCKET CORS BLOCKED:',
                        origin
                    );

                    callback(
                        new Error(
                            `Origin ${origin} not allowed by CORS`
                        )
                    );

                }

            },

            methods: ['GET', 'POST'],

            credentials: true

        }

    });


    // ==================================================
    // NEW CLIENT CONNECTION
    // ==================================================

    io.on('connection', (socket) => {

        console.log('');
        console.log('======================================');
        console.log('🔌 CLIENT CONNECTED');
        console.log('Socket ID:', socket.id);
        console.log('======================================');


        // ==================================================
        // JOIN
        // ==================================================

        socket.on('join', async (data) => {

            try {

                const {
                    userId,
                    userType
                } = data || {};


                console.log('');
                console.log('======================================');
                console.log('🔌 JOIN REQUEST');
                console.log('User ID:', userId);
                console.log('User Type:', userType);
                console.log('Socket ID:', socket.id);
                console.log('======================================');


                if (!userId || !userType) {

                    console.log(
                        '❌ INVALID JOIN DATA'
                    );

                    return;

                }


                // ==================================================
                // USER
                // ==================================================

                if (userType === 'user') {

                    const user =
                        await userModel.findByIdAndUpdate(

                            userId,

                            {
                                socketId: socket.id
                            },

                            {
                                new: true
                            }

                        );


                    if (!user) {

                        console.log(
                            '❌ USER NOT FOUND:',
                            userId
                        );

                        return;

                    }


                    console.log(
                        '✅ USER SOCKET SAVED'
                    );

                    console.log(
                        'User ID:',
                        user._id
                    );

                    console.log(
                        'Socket ID:',
                        user.socketId
                    );

                }


                // ==================================================
                // CAPTAIN
                // ==================================================

                else if (userType === 'captain') {

                    const captain =
                        await captainModel.findByIdAndUpdate(

                            userId,

                            {
                                socketId: socket.id
                            },

                            {
                                new: true
                            }

                        );


                    if (!captain) {

                        console.log(
                            '❌ CAPTAIN NOT FOUND:',
                            userId
                        );

                        return;

                    }


                    console.log(
                        '🚕 CAPTAIN SOCKET SAVED'
                    );

                    console.log(
                        'Captain ID:',
                        captain._id
                    );

                    console.log(
                        'Socket ID:',
                        captain.socketId
                    );

                }


                else {

                    console.log(
                        '❌ UNKNOWN USER TYPE:',
                        userType
                    );

                }

            } catch (error) {

                console.error(
                    '❌ JOIN ERROR:',
                    error
                );

            }

        });


        // ==================================================
        // CAPTAIN LOCATION
        // ==================================================

        socket.on(
            'update-location-captain',
            async (data) => {

                try {

                    const {
                        userId,
                        location
                    } = data || {};


                    if (
                        !userId ||
                        !location ||
                        typeof location.ltd !== 'number' ||
                        typeof location.lng !== 'number'
                    ) {

                        console.log(
                            '❌ INVALID CAPTAIN LOCATION:',
                            data
                        );

                        return;

                    }


                    const captain =
                        await captainModel.findByIdAndUpdate(

                            userId,

                            {
                                location: {
                                    ltd: location.ltd,
                                    lng: location.lng
                                },

                                // Keep socket ID updated
                                socketId: socket.id
                            },

                            {
                                new: true
                            }

                        );


                    if (!captain) {

                        console.log(
                            '❌ CAPTAIN NOT FOUND FOR LOCATION:',
                            userId
                        );

                        return;

                    }


                    console.log(
                        '📍 CAPTAIN LOCATION UPDATED:',
                        userId,
                        location
                    );

                } catch (error) {

                    console.error(
                        '❌ LOCATION UPDATE ERROR:',
                        error
                    );

                }

            }
        );


        // ==================================================
        // DISCONNECT
        // ==================================================

        socket.on('disconnect', async () => {

            console.log('');
            console.log('======================================');
            console.log(
                '🔌 CLIENT DISCONNECTED:',
                socket.id
            );
            console.log('======================================');


            try {

                // Remove this socket ID from user
                await userModel.updateOne(

                    {
                        socketId: socket.id
                    },

                    {
                        $unset: {
                            socketId: 1
                        }
                    }

                );


                // Remove this socket ID from captain
                await captainModel.updateOne(

                    {
                        socketId: socket.id
                    },

                    {
                        $unset: {
                            socketId: 1
                        }
                    }

                );


                console.log(
                    '✅ SOCKET ID CLEANED FROM DATABASE'
                );

            } catch (error) {

                console.error(
                    '❌ DISCONNECT CLEANUP ERROR:',
                    error
                );

            }

        });

    });

}


// ======================================================
// SEND MESSAGE TO SOCKET ID
// ======================================================

const sendMessageToSocketId = (
    socketId,
    messageObject
) => {

    console.log('');
    console.log('======================================');
    console.log('📨 SENDING SOCKET MESSAGE');
    console.log('Socket ID:', socketId);
    console.log(
        'Event:',
        messageObject?.event
    );
    console.log(
        'OTP:',
        messageObject?.data?.otp
    );
    console.log('======================================');


    // ==================================================
    // SOCKET.IO NOT INITIALIZED
    // ==================================================

    if (!io) {

        console.log(
            '❌ SOCKET.IO IS NOT INITIALIZED'
        );

        return false;

    }


    // ==================================================
    // NO SOCKET ID
    // ==================================================

    if (!socketId) {

        console.log(
            '❌ NO SOCKET ID SUPPLIED'
        );

        return false;

    }


    // ==================================================
    // CHECK WHETHER SOCKET IS ACTUALLY CONNECTED
    // ==================================================

    const targetSocket =
        io.sockets.sockets.get(socketId);


    if (!targetSocket) {

        console.log(
            '❌ SOCKET IS NOT CURRENTLY CONNECTED:',
            socketId
        );

        return false;

    }


    // ==================================================
    // SEND EVENT
    // ==================================================

    targetSocket.emit(

        messageObject.event,

        messageObject.data

    );


    console.log('');
    console.log(
        '✅ SOCKET EVENT ACTUALLY SENT'
    );

    console.log(
        'Event:',
        messageObject.event
    );

    console.log(
        'Socket:',
        socketId
    );

    console.log(
        'OTP:',
        messageObject.data?.otp
    );

    console.log('');


    return true;

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    initializeSocket,

    sendMessageToSocketId

};
