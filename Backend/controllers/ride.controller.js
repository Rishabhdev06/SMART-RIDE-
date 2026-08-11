module.exports.createRide = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const { pickup, destination } = req.body;

    try {

        // Create the ride
        const ride = await rideService.createRide({
            user: req.user._id,
            pickup,
            destination
        });

        // Send response to user
        res.status(201).json(ride);


        // ============================================
        // FIND NEARBY CAPTAINS
        // ============================================

        try {

            console.log('');
            console.log('======================================');
            console.log('🚕 NEW RIDE CREATED');
            console.log('Ride ID:', ride._id);
            console.log('Pickup:', pickup);
            console.log('Destination:', destination);
            console.log('======================================');


            const pickupCoordinates =
                await mapService.getAddressCoordinate(pickup);


            console.log(
                '📍 Pickup coordinates:',
                pickupCoordinates
            );


            const captainsInRadius =
                await mapService.getCaptainsInTheRadius(
                    pickupCoordinates.ltd,
                    pickupCoordinates.lng,
                    2
                );


            console.log(
                '🚕 Captains within 2 KM:',
                captainsInRadius.length
            );


            const rideWithUser =
                await rideModel
                    .findOne({ _id: ride._id })
                    .populate('user')
                    .populate('subscription');


            if (!captainsInRadius.length) {

                console.log(
                    '❌ No captains found within 2 KM'
                );

                return;
            }


            captainsInRadius.forEach(captain => {

                console.log('');
                console.log(
                    'Captain:',
                    captain._id
                );

                console.log(
                    'Captain socket:',
                    captain.socketId
                );


                if (!captain.socketId) {

                    console.log(
                        '❌ Captain has no socket ID'
                    );

                    return;
                }


                sendMessageToSocketId(
                    captain.socketId,
                    {
                        event: 'new-ride',
                        data: rideWithUser
                    }
                );


                console.log(
                    '✅ NEW RIDE SENT TO CAPTAIN'
                );

            });

        } catch (notifyErr) {

            console.error(
                '❌ Failed to notify captains:',
                notifyErr
            );

        }

    } catch (err) {

        console.error(
            '❌ CREATE RIDE ERROR:',
            err
        );

        return res.status(400).json({
            message: err.message
        });

    }
};
    
