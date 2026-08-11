const socketIo = require('socket.io');

const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;


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

                if (
                    !origin ||
                    allowedOrigins.includes('*') ||
                    allowedOrigins.includes(
                        origin.replace(/\/$/, '')
                    )
                ) {

                    callback(null, true);

                } else {

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
        console.log('====================================');
        console.log('🔌 CLIENT CONNECTED');
        console.log('Socket ID:', socket.id);
        console.log('====================================');


        // ==================================================
        // JOIN
        // ==================================================
        socket.on('join', async (data) => {

            try {

                console.log('');
                console.log('🔌 JOIN REQUEST RECEIVED');
                console.log('User ID:', data.userId);
                console.log('User Type:', data.userType);
                console.log('Socket ID:', socket.id);


                const { userId, userType } = data;


                if (!userId || !userType) {

                    console.log(
                        '❌ Invalid join data'
                    );

                    return;
                }


                // USER
                if (userType === 'user') {

                    await userModel.findByIdAndUpdate(
                        userId,
                        {
                            socketId: socket.id
                        }
                    );


                    console.log(
                        '✅ USER SOCKET SAVED:',
                        userId,
                        socket.id
                    );

                }


                // CAPTAIN
                else if (userType === 'captain') {

                    await captainModel.findByIdAndUpdate(
                        userId,
                        {
                            socketId: socket.id
                        }
                    );


                    console.log(
                        '🚕 CAPTAIN SOCKET SAVED:',
                        userId,
                        socket.id
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
                    } = data;


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

                        return socket.emit(
                            'error',
                            {
                                message:
                                    'Invalid location data'
                            }
                        );

                    }


                    await captainModel.findByIdAndUpdate(
                        userId,
                        {
                            location: {
                                ltd: location.ltd,
                                lng: location.lng
                            },

                            socketId: socket.id
                        }
                    );


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

            console.log(
                '🔌 CLIENT DISCONNECTED:',
                socket.id
            );

        });

    });

}


// ======================================================
// SEND MESSAGE TO SOCKET
// ======================================================
const sendMessageToSocketId = (
    socketId,
    messageObject
) => {

    console.log('');
    console.log('====================================');
    console.log('📨 SOCKET MESSAGE');
    console.log('Socket ID:', socketId);
    console.log('Event:', messageObject.event);
    console.log('====================================');


    if (!io) {

        console.log(
            '❌ Socket.io is NOT initialized'
        );

        return;

    }


    if (!socketId) {

        console.log(
            '❌ No socket ID supplied'
        );

        return;

    }


    io.to(socketId).emit(
        messageObject.event,
        messageObject.data
    );


    console.log(
        '✅ SOCKET EVENT SENT'
    );

};


module.exports = {
    initializeSocket,
    sendMessageToSocketId
};
       
