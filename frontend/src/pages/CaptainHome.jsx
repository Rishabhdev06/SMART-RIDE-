import React, {
    useRef,
    useState,
    useEffect,
    useContext
} from 'react'

import { Link } from 'react-router-dom'

import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

import ConfirmRidePopUp from '../components/ConfirmRidePopUp'

import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'

import axios from 'axios'

import LiveTracking from '../components/LiveTracking'


const CaptainHome = () => {

    const [ridePopupPanel, setRidePopupPanel] =
        useState(false)

    const [confirmRidePopupPanel, setConfirmRidePopupPanel] =
        useState(false)

    const ridePopupPanelRef =
        useRef(null)

    const confirmRidePopupPanelRef =
        useRef(null)

    const [ride, setRide] =
        useState(null)


    const { socket } =
        useContext(SocketContext)

    const { captain } =
        useContext(CaptainDataContext)


    // ======================================================
    // SOCKET CONNECTION + CAPTAIN JOIN + LOCATION
    // ======================================================
    useEffect(() => {

        if (!captain?._id) {
            console.log(
                '❌ Captain data not available yet'
            )

            return
        }


        console.log(
            '🚕 Captain Home loaded:',
            captain._id
        )


        // ==================================================
        // JOIN SOCKET
        // ==================================================
        const sendJoin = () => {

            console.log(
                '🚕 CAPTAIN JOINING SOCKET:',
                captain._id
            )

            socket.emit('join', {

                userId: captain._id,

                userType: 'captain'

            })

        }


        // If socket already connected
        if (socket.connected) {

            sendJoin()

        }


        // If socket connects/reconnects
        socket.on(
            'connect',
            sendJoin
        )


        // ==================================================
        // UPDATE CAPTAIN LOCATION
        // ==================================================
        const updateLocation = () => {

            if (!navigator.geolocation) {

                console.log(
                    '❌ Geolocation is not supported'
                )

                return
            }


            navigator.geolocation.getCurrentPosition(

                (position) => {

                    const location = {

                        ltd:
                            position.coords.latitude,

                        lng:
                            position.coords.longitude

                    }


                    console.log(
                        '📍 Sending captain location:',
                        location
                    )


                    socket.emit(
                        'update-location-captain',
                        {

                            userId:
                                captain._id,

                            location

                        }
                    )

                },

                (error) => {

                    console.log(
                        '❌ LOCATION ERROR:',
                        error.message
                    )

                }

            )

        }


        // Send immediately
        updateLocation()


        // Send every 10 seconds
        const locationInterval =
            setInterval(
                updateLocation,
                10000
            )


        // ==================================================
        // CLEANUP
        // ==================================================
        return () => {

            socket.off(
                'connect',
                sendJoin
            )

            clearInterval(
                locationInterval
            )

        }

    }, [socket, captain?._id])


    // ======================================================
    // RECEIVE NEW RIDE
    // ======================================================

    useEffect(() => {

    const handleNewRide = (data) => {

        console.log('');
        console.log('🚕🚕🚕 NEW RIDE RECEIVED 🚕🚕🚕');
        console.log(data);

        setRide(data);
        setRidePopupPanel(true);

    };


    socket.on(
        'new-ride',
        handleNewRide
    );


    return () => {

        socket.off(
            'new-ride',
            handleNewRide
        );

    };

}, [socket]);


    // ======================================================
    // CONFIRM RIDE
    // ======================================================
   async function confirmRide() {

    console.log('');
    console.log('======================================');
    console.log('🚕 CAPTAIN CLICKED ACCEPT');
    console.log('Ride object:', ride);
    console.log('Ride ID:', ride?._id);
    console.log('======================================');


    if (!ride?._id) {

        console.error(
            '❌ Cannot confirm ride: ride ID is missing'
        );

        return;

    }


    try {

        const token =
            localStorage.getItem('token');


        console.log(
            '🔑 Captain token exists:',
            !!token
        );


        if (!token) {

            console.error(
                '❌ Captain token is missing'
            );

            return;

        }


        // ==================================================
        // CONFIRM RIDE API
        // ==================================================

        const response =
            await axios.post(

                `${import.meta.env.VITE_BASE_URL}/rides/confirm`,

                {
                    rideId: ride._id
                },

                {
                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }

            );


        console.log('');
        console.log('======================================');
        console.log('✅ RIDE CONFIRM API SUCCESS');
        console.log('Response:', response.data);
        console.log('Ride ID:', response.data?._id);
        console.log('OTP:', response.data?.otp);
        console.log('======================================');


        // ==================================================
        // CLOSE NEW RIDE POPUP
        // ==================================================

        setRidePopupPanel(false);


        // ==================================================
        // SHOW CONFIRM/WAITING PANEL ON CAPTAIN SIDE
        // ==================================================

        setConfirmRidePopupPanel(true);


    } catch (error) {

        console.error('');
        console.error('======================================');
        console.error('❌ CONFIRM RIDE FAILED');
        console.error(
            'Status:',
            error.response?.status
        );
        console.error(
            'Backend message:',
            error.response?.data
        );
        console.error(
            'Full error:',
            error
        );
        console.error('======================================');

    }

}

    // ======================================================
    // RIDE POPUP ANIMATION
    // ======================================================
    useGSAP(
        function () {

            if (ridePopupPanel) {

                gsap.to(
                    ridePopupPanelRef.current,
                    {
                        transform:
                            'translateY(0)'
                    }
                )

            } else {

                gsap.to(
                    ridePopupPanelRef.current,
                    {
                        transform:
                            'translateY(100%)'
                    }
                )

            }

        },
        [ridePopupPanel]
    )


    // ======================================================
    // CONFIRM RIDE POPUP ANIMATION
    // ======================================================
    useGSAP(
        function () {

            if (confirmRidePopupPanel) {

                gsap.to(
                    confirmRidePopupPanelRef.current,
                    {
                        transform:
                            'translateY(0)'
                    }
                )

            } else {

                gsap.to(
                    confirmRidePopupPanelRef.current,
                    {
                        transform:
                            'translateY(100%)'
                    }
                )

            }

        },
        [confirmRidePopupPanel]
    )


    // ======================================================
    // UI
    // ======================================================
    return (

        <div className='h-screen'>

            <div className='fixed p-6 top-0 flex items-center justify-between w-screen z-10'>

                <div className='font-bold text-xl tracking-tight'>
                    Smart Ride
                </div>


                <Link
                    to='/captain/logout'
                    className='h-10 w-10 bg-white flex items-center justify-center rounded-full'
                >

                    <i className="text-lg font-medium ri-logout-box-r-line"></i>

                </Link>

            </div>


            <div className='h-3/5'>

                <LiveTracking />

            </div>


            <div className='h-2/5 p-6'>

                <CaptainDetails />

            </div>


            {/* ==============================================
                NEW RIDE POPUP
            ============================================== */}

            <div
                ref={ridePopupPanelRef}
                className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'
            >

                <RidePopUp

                    ride={ride}

                    setRidePopupPanel={
                        setRidePopupPanel
                    }

                    setConfirmRidePopupPanel={
                        setConfirmRidePopupPanel
                    }

                    confirmRide={
                        confirmRide
                    }

                />

            </div>


            {/* ==============================================
                CONFIRMED RIDE POPUP
            ============================================== */}

            <div
                ref={confirmRidePopupPanelRef}
                className='fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'
            >

                <ConfirmRidePopUp

                    ride={ride}

                    setConfirmRidePopupPanel={
                        setConfirmRidePopupPanel
                    }

                    setRidePopupPanel={
                        setRidePopupPanel
                    }

                />

            </div>

        </div>

    )

}


export default CaptainHome
