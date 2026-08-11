import React, {
    useEffect,
    useRef,
    useState,
    useContext
} from 'react'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

import axios from 'axios'

import 'remixicon/fonts/remixicon.css'

import { Link, useNavigate } from 'react-router-dom'

import LocationSearchPanel from '../components/LocationSearchPanel'
import VehiclePanel from '../components/VehiclePanel'
import ConfirmRide from '../components/ConfirmRide'
import LookingForDriver from '../components/LookingForDriver'
import WaitingForDriver from '../components/WaitingForDriver'
import LiveTracking from '../components/LiveTracking'

import { SocketContext } from '../context/SocketContext'
import { UserDataContext } from '../context/UserContext'
import { SubscriptionDataContext } from '../context/SubscriptionContext'


const Home = () => {

    // =====================================================
    // BASIC STATES
    // =====================================================

    const [pickup, setPickup] = useState('')
    const [destination, setDestination] = useState('')

    const [panelOpen, setPanelOpen] = useState(false)

    const [vehiclePanel, setVehiclePanel] = useState(false)

    const [confirmRidePanel, setConfirmRidePanel] =
        useState(false)

    const [vehicleFound, setVehicleFound] =
        useState(false)

    const [waitingForDriver, setWaitingForDriver] =
        useState(false)


    // =====================================================
    // SUGGESTIONS
    // =====================================================

    const [pickupSuggestions, setPickupSuggestions] =
        useState([])

    const [destinationSuggestions, setDestinationSuggestions] =
        useState([])

    const [activeField, setActiveField] =
        useState(null)


    // =====================================================
    // RIDE
    // =====================================================

    const [ride, setRide] =
        useState(null)


    // =====================================================
    // ERRORS
    // =====================================================

    const [bookingError, setBookingError] =
        useState('')


    // =====================================================
    // SUBSCRIPTION LOADING
    // =====================================================

    const [subscriptionLoading, setSubscriptionLoading] =
        useState(true)


    // =====================================================
    // REFS
    // =====================================================

    const vehiclePanelRef =
        useRef(null)

    const confirmRidePanelRef =
        useRef(null)

    const vehicleFoundRef =
        useRef(null)

    const waitingForDriverRef =
        useRef(null)

    const panelRef =
        useRef(null)

    const panelCloseRef =
        useRef(null)


    // =====================================================
    // CONTEXT
    // =====================================================

    const { socket } =
        useContext(SocketContext)

    const { user } =
        useContext(UserDataContext)

    const {
        subscription,
        setSubscription
    } =
        useContext(SubscriptionDataContext)


    // =====================================================
    // NAVIGATION
    // =====================================================

    const navigate =
        useNavigate()


    // =====================================================
    // LOAD SUBSCRIPTION
    // =====================================================

    useEffect(() => {

        const loadSubscription = async () => {

            try {

                const token =
                    localStorage.getItem('token')


                if (!token) {

                    console.log(
                        '❌ No login token found'
                    )

                    setSubscription(null)

                    return

                }


                console.log(
                    '🔄 Loading user subscription...'
                )


                const response =
                    await axios.get(

                        `${import.meta.env.VITE_BASE_URL}/subscriptions/me`,

                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }

                    )


                console.log(
                    '✅ Subscription loaded:',
                    response.data
                )


                setSubscription(
                    response.data
                )


            } catch (error) {

                console.error(
                    '❌ Failed to load subscription:',
                    error.response?.status,
                    error.response?.data ||
                    error.message
                )


                setSubscription(null)


            } finally {

                setSubscriptionLoading(false)

            }

        }


        loadSubscription()

    }, [setSubscription])


    // =====================================================
    // REGISTER USER WITH SOCKET
    // =====================================================

    useEffect(() => {

        if (
            !user ||
            !user._id ||
            !socket
        ) {

            return

        }


        const sendJoin = () => {

            console.log(
                '👤 USER JOINING SOCKET:',
                user._id
            )


            socket.emit(
                'join',
                {
                    userType: 'user',
                    userId: user._id
                }
            )

        }


        if (socket.connected) {

            sendJoin()

        }


        socket.on(
            'connect',
            sendJoin
        )


        return () => {

            socket.off(
                'connect',
                sendJoin
            )

        }

    }, [
        user,
        socket
    ])


    // =====================================================
    // RECEIVE RIDE CONFIRMED / STARTED
    // =====================================================

    useEffect(() => {

        if (!socket) {
            return
        }


        // -----------------------------------------------
        // CAPTAIN CONFIRMED RIDE
        // -----------------------------------------------

        const handleRideConfirmed = (rideData) => {

            console.log('')
            console.log(
                '======================================'
            )
            console.log(
                '🚕 RIDE CONFIRMED BY CAPTAIN'
            )
            console.log(
                'Ride:',
                rideData
            )
            console.log(
                'OTP:',
                rideData?.otp
            )
            console.log(
                '======================================'
            )


            setRide(
                rideData
            )


            setVehicleFound(
                false
            )


            setConfirmRidePanel(
                false
            )


            setWaitingForDriver(
                true
            )

        }


        // -----------------------------------------------
        // RIDE STARTED
        // -----------------------------------------------

        const handleRideStarted = (rideData) => {

            console.log(
                '🚕 RIDE STARTED:',
                rideData
            )


            setWaitingForDriver(
                false
            )


            navigate(
                '/riding',
                {
                    state: {
                        ride: rideData
                    }
                }
            )

        }


        socket.on(
            'ride-confirmed',
            handleRideConfirmed
        )


        socket.on(
            'ride-started',
            handleRideStarted
        )


        return () => {

            socket.off(
                'ride-confirmed',
                handleRideConfirmed
            )


            socket.off(
                'ride-started',
                handleRideStarted
            )

        }

    }, [
        socket,
        navigate
    ])


    // =====================================================
    // PICKUP SUGGESTIONS
    // =====================================================

    const handlePickupChange =
        async (e) => {

            const value =
                e.target.value


            setPickup(
                value
            )


            if (!value.trim()) {

                setPickupSuggestions([])

                return

            }


            try {

                const response =
                    await axios.get(

                        `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,

                        {
                            params: {
                                input: value
                            },

                            headers: {
                                Authorization:
                                    `Bearer ${localStorage.getItem('token')}`
                            }
                        }

                    )


                setPickupSuggestions(
                    response.data
                )


            } catch (error) {

                console.error(
                    '❌ Pickup suggestions error:',
                    error
                )

            }

        }


    // =====================================================
    // DESTINATION SUGGESTIONS
    // =====================================================

    const handleDestinationChange =
        async (e) => {

            const value =
                e.target.value


            setDestination(
                value
            )


            if (!value.trim()) {

                setDestinationSuggestions([])

                return

            }


            try {

                const response =
                    await axios.get(

                        `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,

                        {
                            params: {
                                input: value
                            },

                            headers: {
                                Authorization:
                                    `Bearer ${localStorage.getItem('token')}`
                            }
                        }

                    )


                setDestinationSuggestions(
                    response.data
                )


            } catch (error) {

                console.error(
                    '❌ Destination suggestions error:',
                    error
                )

            }

        }


    // =====================================================
    // FORM SUBMIT
    // =====================================================

    const submitHandler =
        (e) => {

            e.preventDefault()

        }


    // =====================================================
    // MAIN LOCATION PANEL ANIMATION
    // =====================================================

    useGSAP(

        () => {

            if (panelOpen) {

                gsap.to(
                    panelRef.current,
                    {
                        height: '70%',
                        padding: 24
                    }
                )


                gsap.to(
                    panelCloseRef.current,
                    {
                        opacity: 1
                    }
                )

            } else {

                gsap.to(
                    panelRef.current,
                    {
                        height: '0%',
                        padding: 0
                    }
                )


                gsap.to(
                    panelCloseRef.current,
                    {
                        opacity: 0
                    }
                )

            }

        },

        [panelOpen]

    )


    // =====================================================
    // VEHICLE PANEL ANIMATION
    // =====================================================

    useGSAP(

        () => {

            if (vehiclePanel) {

                gsap.to(
                    vehiclePanelRef.current,
                    {
                        transform:
                            'translateY(0)'
                    }
                )

            } else {

                gsap.to(
                    vehiclePanelRef.current,
                    {
                        transform:
                            'translateY(100%)'
                    }
                )

            }

        },

        [vehiclePanel]

    )


    // =====================================================
    // CONFIRM RIDE PANEL ANIMATION
    // =====================================================

    useGSAP(

        () => {

            if (confirmRidePanel) {

                gsap.to(
                    confirmRidePanelRef.current,
                    {
                        transform:
                            'translateY(0)'
                    }
                )

            } else {

                gsap.to(
                    confirmRidePanelRef.current,
                    {
                        transform:
                            'translateY(100%)'
                    }
                )

            }

        },

        [confirmRidePanel]

    )


    // =====================================================
    // LOOKING FOR DRIVER ANIMATION
    // =====================================================

    useGSAP(

        () => {

            if (vehicleFound) {

                gsap.to(
                    vehicleFoundRef.current,
                    {
                        transform:
                            'translateY(0)'
                    }
                )

            } else {

                gsap.to(
                    vehicleFoundRef.current,
                    {
                        transform:
                            'translateY(100%)'
                    }
                )

            }

        },

        [vehicleFound]

    )


    // =====================================================
    // WAITING FOR DRIVER ANIMATION
    // =====================================================

    useGSAP(

        () => {

            if (waitingForDriver) {

                gsap.to(
                    waitingForDriverRef.current,
                    {
                        transform:
                            'translateY(0)'
                    }
                )

            } else {

                gsap.to(
                    waitingForDriverRef.current,
                    {
                        transform:
                            'translateY(100%)'
                    }
                )

            }

        },

        [waitingForDriver]

    )


    // =====================================================
    // FIND TRIP
    // =====================================================

    async function findTrip() {

        setBookingError('')


        // -----------------------------------------------
        // CHECK ACTIVE SUBSCRIPTION
        // -----------------------------------------------

        if (
            !subscription ||
            subscription.status !== 'active'
        ) {

            setBookingError(
                'You need an active monthly plan to book a pickup & drop.'
            )

            return

        }


        // -----------------------------------------------
        // CHECK RIDES REMAINING
        // -----------------------------------------------

        if (
            Number(subscription.ridesRemaining) <= 0
        ) {

            setBookingError(
                'You have used all the rides included in your plan this month.'
            )

            return

        }


        // -----------------------------------------------
        // CHECK PICKUP
        // -----------------------------------------------

        if (!pickup.trim()) {

            setBookingError(
                'Please enter your pickup location.'
            )

            return

        }


        // -----------------------------------------------
        // CHECK DESTINATION
        // -----------------------------------------------

        if (!destination.trim()) {

            setBookingError(
                'Please enter your destination.'
            )

            return

        }


        // -----------------------------------------------
        // OPEN VEHICLE PANEL
        // -----------------------------------------------

        setVehiclePanel(
            true
        )


        setPanelOpen(
            false
        )

    }


    // =====================================================
    // CREATE RIDE
    // =====================================================

    async function createRide() {

        setBookingError('')


        try {

            console.log(
                '🚕 Creating ride...'
            )


            const response =
                await axios.post(

                    `${import.meta.env.VITE_BASE_URL}/rides/create`,

                    {
                        pickup,
                        destination
                    },

                    {
                        headers: {
                            Authorization:
                                `Bearer ${localStorage.getItem('token')}`
                        }
                    }

                )


            console.log(
                '✅ Ride created:',
                response.data
            )


            // -------------------------------------------
            // UPDATE LOCAL SUBSCRIPTION
            // -------------------------------------------

            setSubscription(
                prev => {

                    if (!prev) {
                        return prev
                    }


                    return {

                        ...prev,

                        ridesRemaining:
                            Math.max(
                                0,
                                Number(
                                    prev.ridesRemaining
                                ) - 1
                            ),

                        ridesUsed:
                            Number(
                                prev.ridesUsed || 0
                            ) + 1

                    }

                }
            )


            return response.data


        } catch (error) {

            console.error(
                '❌ CREATE RIDE ERROR:',
                error
            )


            setBookingError(

                error.response?.data?.message ||
                'Could not book this ride.'

            )


            setVehicleFound(
                false
            )


            return null

        }

    }


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className='h-screen relative overflow-hidden'>

            {/* ============================================
                LOGO
            ============================================ */}

            <div className='absolute left-5 top-5 z-10 bg-white/90 rounded-lg px-3 py-1 font-bold text-lg tracking-tight'>

                Smart Ride

            </div>


            {/* ============================================
                MAP
            ============================================ */}

            <div className='h-screen w-screen'>

                <LiveTracking />

            </div>


            {/* ============================================
                BOTTOM BOOKING PANEL
            ============================================ */}

            <div className='flex flex-col justify-end h-screen absolute top-0 w-full'>

                <div className='h-[30%] p-6 bg-white relative'>

                    {/* CLOSE BUTTON */}

                    <h5
                        ref={panelCloseRef}
                        onClick={() => {
                            setPanelOpen(false)
                        }}
                        className='absolute opacity-0 right-6 top-6 text-2xl'
                    >

                        <i className="ri-arrow-down-wide-line"></i>

                    </h5>


                    <h4 className='text-2xl font-semibold'>

                        Book your pickup &amp; drop

                    </h4>


                    {/* =====================================
                        SUBSCRIPTION STATUS
                    ===================================== */}

                    {subscriptionLoading && (

                        <p className='text-sm text-gray-500 mt-1'>

                            Checking your monthly plan...

                        </p>

                    )}


                    {!subscriptionLoading &&
                        subscription &&
                        subscription.status === 'active' && (

                            <p className='text-sm text-gray-600 mt-1'>

                                {subscription.plan?.name ||
                                    'Active Plan'}

                                {' · '}

                                {subscription.ridesRemaining}

                                {' rides left this month'}

                            </p>

                        )}


                    {!subscriptionLoading &&
                        (!subscription ||
                            subscription.status !== 'active') && (

                            <p className='text-sm text-red-600 mt-1'>

                                No active plan.{' '}

                                <Link
                                    to='/plans'
                                    className='underline font-medium'
                                >

                                    Subscribe now

                                </Link>

                                {' '}to start booking rides.

                            </p>

                        )}


                    {/* BOOKING ERROR */}

                    {bookingError && (

                        <p className='text-sm text-red-600 mt-1'>

                            {bookingError}

                        </p>

                    )}


                    {/* =====================================
                        LOCATION FORM
                    ===================================== */}

                    <form
                        className='relative py-3'
                        onSubmit={submitHandler}
                    >

                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full">
                        </div>


                        {/* PICKUP */}

                        <input

                            onClick={() => {

                                setPanelOpen(true)

                                setActiveField('pickup')

                            }}

                            value={pickup}

                            onChange={
                                handlePickupChange
                            }

                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'

                            type="text"

                            placeholder='Add a pick-up location'

                        />


                        {/* DESTINATION */}

                        <input

                            onClick={() => {

                                setPanelOpen(true)

                                setActiveField(
                                    'destination'
                                )

                            }}

                            value={destination}

                            onChange={
                                handleDestinationChange
                            }

                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3'

                            type="text"

                            placeholder='Enter your destination'

                        />

                    </form>


                    {/* FIND TRIP */}

                    <button

                        onClick={findTrip}

                        disabled={
                            subscriptionLoading
                        }

                        className={`bg-black text-white px-4 py-2 rounded-lg mt-3 w-full ${
                            subscriptionLoading
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                        }`}

                    >

                        Find Trip

                    </button>

                </div>


                {/* =========================================
                    LOCATION SEARCH PANEL
                ========================================= */}

                <div
                    ref={panelRef}
                    className='bg-white h-0'
                >

                    <LocationSearchPanel

                        suggestions={
                            activeField === 'pickup'
                                ? pickupSuggestions
                                : destinationSuggestions
                        }

                        setPanelOpen={
                            setPanelOpen
                        }

                        setVehiclePanel={
                            setVehiclePanel
                        }

                        setPickup={
                            setPickup
                        }

                        setDestination={
                            setDestination
                        }

                        activeField={
                            activeField
                        }

                    />

                </div>

            </div>


            {/* =============================================
                VEHICLE PANEL
            ============================================= */}

            <div
                ref={vehiclePanelRef}
                className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'
            >

                <VehiclePanel

                    subscription={
                        subscription
                    }

                    setConfirmRidePanel={
                        setConfirmRidePanel
                    }

                    setVehiclePanel={
                        setVehiclePanel
                    }

                />

            </div>


            {/* =============================================
                CONFIRM RIDE PANEL
            ============================================= */}

            <div
                ref={confirmRidePanelRef}
                className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'
            >

                <ConfirmRide

                    createRide={
                        createRide
                    }

                    pickup={
                        pickup
                    }

                    destination={
                        destination
                    }

                    subscription={
                        subscription
                    }

                    setConfirmRidePanel={
                        setConfirmRidePanel
                    }

                    setVehicleFound={
                        setVehicleFound
                    }

                />

            </div>


            {/* =============================================
                LOOKING FOR DRIVER
            ============================================= */}

            <div
                ref={vehicleFoundRef}
                className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'
            >

                <LookingForDriver

                    pickup={
                        pickup
                    }

                    destination={
                        destination
                    }

                    subscription={
                        subscription
                    }

                    setVehicleFound={
                        setVehicleFound
                    }

                />

            </div>


            {/* =============================================
                WAITING FOR DRIVER
            ============================================= */}

            <div
                ref={waitingForDriverRef}
                className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'
            >

                <WaitingForDriver

                    ride={
                        ride
                    }

                    setVehicleFound={
                        setVehicleFound
                    }

                    setWaitingForDriver={
                        setWaitingForDriver
                    }

                    waitingForDriver={
                        waitingForDriver
                    }

                />

            </div>

        </div>

    )

}


export default Home

  
