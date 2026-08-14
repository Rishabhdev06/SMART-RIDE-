import React, { useEffect, useRef, useState, useContext } from 'react'
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
    const [ pickup, setPickup ] = useState('')
    const [ destination, setDestination ] = useState('')
    const [ panelOpen, setPanelOpen ] = useState(false)
    const [ vehiclePanel, setVehiclePanel ] = useState(false)
    const [ confirmRidePanel, setConfirmRidePanel ] = useState(false)
    const [ vehicleFound, setVehicleFound ] = useState(false)
    const [ waitingForDriver, setWaitingForDriver ] = useState(false)

    const [ pickupSuggestions, setPickupSuggestions ] = useState([])
    const [ destinationSuggestions, setDestinationSuggestions ] = useState([])
    const [ activeField, setActiveField ] = useState(null)

    const [ ride, setRide ] = useState(null)
    const [ bookingError, setBookingError ] = useState('')
    const [ subscriptionLoading, setSubscriptionLoading ] = useState(true)

    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)
    const { subscription, setSubscription } = useContext(SubscriptionDataContext)

    const navigate = useNavigate()

    // Load subscription
    useEffect(() => {
        const loadSubscription = async () => {
            try {
                const token = localStorage.getItem('userToken')
                if (!token) {
                    setSubscription(null)
                    return
                }

                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/subscriptions/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                })

                console.log('✅ Subscription loaded:', response.data)
                setSubscription(response.data)
            } catch (error) {
                console.error('❌ Failed to load subscription:', error.response?.status, error.response?.data || error.message)
                setSubscription(null)
            } finally {
                setSubscriptionLoading(false)
            }
        }

        loadSubscription()
    }, [ setSubscription ])

    // Register user with socket - re-join on every connect, including reconnects
    useEffect(() => {
        if (!socket || !user?._id) return

        const joinUser = () => {
            console.log('👤 USER SOCKET CONNECTED', socket.id, user._id)
            socket.emit('join', { userType: 'user', userId: user._id })
        }

        if (socket.connected) joinUser()
        socket.on('connect', joinUser)

        return () => {
            socket.off('connect', joinUser)
        }
    }, [ socket, user ])

    // Receive ride events
    useEffect(() => {
        if (!socket) return

        const handleRideConfirmed = (confirmedRide) => {
            console.log('🚕 RIDE CONFIRMED EVENT RECEIVED:', confirmedRide)

            if (!confirmedRide) {
                console.log('❌ CONFIRMED RIDE IS NULL')
                return
            }

            setRide(confirmedRide)
            setVehicleFound(false)
            setWaitingForDriver(true)
        }

        const handleRideStarted = (startedRide) => {
            console.log('🚕 RIDE STARTED:', startedRide)
            setWaitingForDriver(false)
            navigate('/riding', { state: { ride: startedRide } })
        }

        const handleRideEnded = (rideData) => {
            console.log('🏁 RIDE ENDED:', rideData)
            setWaitingForDriver(false)
            setVehicleFound(false)
            setRide(null)
        }

        socket.on('ride-confirmed', handleRideConfirmed)
        socket.on('ride-started', handleRideStarted)
        socket.on('ride-ended', handleRideEnded)

        return () => {
            socket.off('ride-confirmed', handleRideConfirmed)
            socket.off('ride-started', handleRideStarted)
            socket.off('ride-ended', handleRideEnded)
        }
    }, [ socket, navigate ])

    const handlePickupChange = async (e) => {
        const value = e.target.value
        setPickup(value)

        if (!value.trim()) {
            setPickupSuggestions([])
            return
        }

        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: value },
                headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` }
            })
            setPickupSuggestions(response.data)
        } catch (error) {
            console.error('❌ Pickup suggestions error:', error)
        }
    }

    const handleDestinationChange = async (e) => {
        const value = e.target.value
        setDestination(value)

        if (!value.trim()) {
            setDestinationSuggestions([])
            return
        }

        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: value },
                headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` }
            })
            setDestinationSuggestions(response.data)
        } catch (error) {
            console.error('❌ Destination suggestions error:', error)
        }
    }

    const submitHandler = (e) => {
        e.preventDefault()
    }

    useGSAP(() => {
        if (panelOpen) {
            gsap.to(panelRef.current, { height: '70%', padding: 24 })
            gsap.to(panelCloseRef.current, { opacity: 1 })
        } else {
            gsap.to(panelRef.current, { height: '0%', padding: 0 })
            gsap.to(panelCloseRef.current, { opacity: 0 })
        }
    }, [ panelOpen ])

    useGSAP(() => {
        gsap.to(vehiclePanelRef.current, { transform: vehiclePanel ? 'translateY(0)' : 'translateY(100%)' })
    }, [ vehiclePanel ])

    useGSAP(() => {
        gsap.to(confirmRidePanelRef.current, { transform: confirmRidePanel ? 'translateY(0)' : 'translateY(100%)' })
    }, [ confirmRidePanel ])

    useGSAP(() => {
        gsap.to(vehicleFoundRef.current, { transform: vehicleFound ? 'translateY(0)' : 'translateY(100%)' })
    }, [ vehicleFound ])

    useGSAP(() => {
        gsap.to(waitingForDriverRef.current, { transform: waitingForDriver ? 'translateY(0)' : 'translateY(100%)', duration: 0.4 })
    }, [ waitingForDriver ])

    async function findTrip() {
        setBookingError('')

        if (!subscription || subscription.status !== 'active') {
            setBookingError('You need an active monthly plan to book a pickup & drop.')
            return
        }

        if (Number(subscription.ridesRemaining) <= 0) {
            setBookingError('You have used all the rides included in your plan this month.')
            return
        }

        if (!pickup.trim()) {
            setBookingError('Please enter your pickup location.')
            return
        }

        if (!destination.trim()) {
            setBookingError('Please enter your destination.')
            return
        }

        setVehiclePanel(true)
        setPanelOpen(false)
    }

    async function createRide() {
        setBookingError('')

        try {
            console.log('🚕 Creating ride...')

            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
                pickup,
                destination
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` }
            })

            console.log('✅ Ride created:', response.data)
             setRide(response.data)
            setSubscription(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    ridesRemaining: Math.max(0, Number(prev.ridesRemaining) - 1),
                    ridesUsed: Number(prev.ridesUsed || 0) + 1
                }
            })

            return response.data
        } catch (error) {
            console.error('❌ CREATE RIDE ERROR:', error)
            setBookingError(error.response?.data?.message || 'Could not book this ride.')
            setVehicleFound(false)
            return null
        }
    }

    return (
        <div className='h-screen relative overflow-hidden'>
            <div className='absolute left-5 top-5 z-10 bg-white/90 rounded-lg px-3 py-1 font-bold text-lg tracking-tight'>
                Smart Ride
            </div>

            <div className='relative z-0 h-screen w-screen'>
                <LiveTracking />
            </div>

            <div className='absolute top-0 z-10 flex h-screen w-full flex-col justify-end'>
                <div className='h-[30%] p-6 bg-white relative'>
                    <h5 ref={panelCloseRef} onClick={() => setPanelOpen(false)} className='absolute opacity-0 right-6 top-6 text-2xl'>
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>

                    <h4 className='text-2xl font-semibold'>Book your pickup &amp; drop</h4>

                    {subscriptionLoading && (
                        <p className='text-sm text-gray-500 mt-1'>Checking your monthly plan...</p>
                    )}

                    {!subscriptionLoading && subscription && subscription.status === 'active' && (
                        <p className='text-sm text-gray-600 mt-1'>
                            {subscription.plan?.name || 'Active Plan'} · {subscription.ridesRemaining} rides left this month
                        </p>
                    )}

                    {!subscriptionLoading && (!subscription || subscription.status !== 'active') && (
                        <p className='text-sm text-red-600 mt-1'>
                            No active plan. <Link to='/plans' className='underline font-medium'>Subscribe now</Link> to start booking rides.
                        </p>
                    )}

                    {bookingError && (
                        <p className='text-sm text-red-600 mt-1'>{bookingError}</p>
                    )}

                    <form className='relative py-3' onSubmit={submitHandler}>
                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>

                        <input
                            onClick={() => { setPanelOpen(true); setActiveField('pickup') }}
                            value={pickup}
                            onChange={handlePickupChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
                            type="text"
                            placeholder='Add a pick-up location'
                        />

                        <input
                            onClick={() => { setPanelOpen(true); setActiveField('destination') }}
                            value={destination}
                            onChange={handleDestinationChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3'
                            type="text"
                            placeholder='Enter your destination'
                        />
                    </form>

                    <button
                        onClick={findTrip}
                        disabled={subscriptionLoading}
                        className={`bg-black text-white px-4 py-2 rounded-lg mt-3 w-full ${subscriptionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Find Trip
                    </button>
                </div>

                <div ref={panelRef} className='bg-white h-0'>
                    <LocationSearchPanel
                        suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}
                        setPickup={setPickup}
                        setDestination={setDestination}
                        activeField={activeField}
                    />
                </div>
            </div>

            <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <VehiclePanel
                    subscription={subscription}
                    setConfirmRidePanel={setConfirmRidePanel}
                    setVehiclePanel={setVehiclePanel}
                />
            </div>

            <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    subscription={subscription}
                    setConfirmRidePanel={setConfirmRidePanel}
                    setVehicleFound={setVehicleFound}
                />
            </div>

            <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <LookingForDriver
                    pickup={pickup}
                    destination={destination}
                    subscription={subscription}
                    setVehicleFound={setVehicleFound}
                />
            </div>

            <div ref={waitingForDriverRef} className='fixed w-full z-20 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <WaitingForDriver
                    ride={ride}
                    setVehicleFound={setVehicleFound}
                    setWaitingForDriver={setWaitingForDriver}
                    waitingForDriver={waitingForDriver}
                />
            </div>
        </div>
    )
}

export default Home
