import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { SubscriptionDataContext } from '../context/SubscriptionContext'
import 'remixicon/fonts/remixicon.css'

const MySubscription = () => {
    const { subscription, setSubscription } = useContext(SubscriptionDataContext)
    const [ loading, setLoading ] = useState(true)
    const [ cancelling, setCancelling ] = useState(false)
    const [ error, setError ] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_BASE_URL}/subscriptions/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => setSubscription(res.data))
            .catch(() => setError('Could not load your subscription.'))
            .finally(() => setLoading(false))
    }, [])

    const cancel = async () => {
        setCancelling(true)
        setError('')
        try {
            await axios.post(`${import.meta.env.VITE_BASE_URL}/subscriptions/cancel`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            setSubscription(null)
        } catch (err) {
            setError(err.response?.data?.message || 'Could not cancel your plan.')
        } finally {
            setCancelling(false)
        }
    }

    return (
        <div className='p-6 h-screen'>
            <div className='flex items-center justify-between mb-6'>
                <h1 className='text-2xl font-bold'>My Subscription</h1>
                <i className='ri-close-line text-2xl cursor-pointer' onClick={() => navigate('/home')}></i>
            </div>

            {loading && <p>Loading...</p>}
            {error && <div className='bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 mb-4'>{error}</div>}

            {!loading && !subscription && (
                <div>
                    <p className='text-gray-600 mb-4'>You don't have an active plan yet.</p>
                    <Link to='/plans' className='inline-block bg-black text-white font-semibold px-4 py-2 rounded-lg'>Browse Plans</Link>
                </div>
            )}

            {subscription && (
                <div className='border-2 rounded-xl p-4'>
                    <h2 className='text-xl font-semibold'>{subscription.plan?.name} Plan</h2>
                    <p className='text-gray-600 text-sm mb-3'>{subscription.plan?.description}</p>
                    <div className='flex justify-between py-2 border-b'>
                        <span className='text-gray-600'>Rides remaining</span>
                        <span className='font-semibold'>{subscription.ridesRemaining} / {subscription.ridesAllotted}</span>
                    </div>
                    <div className='flex justify-between py-2 border-b'>
                        <span className='text-gray-600'>Vehicle type</span>
                        <span className='font-semibold capitalize'>{subscription.plan?.vehicleType}</span>
                    </div>
                    <div className='flex justify-between py-2 border-b'>
                        <span className='text-gray-600'>Renews / expires on</span>
                        <span className='font-semibold'>{new Date(subscription.endDate).toLocaleDateString()}</span>
                    </div>
                    <button
                        onClick={cancel}
                        disabled={cancelling}
                        className='w-full mt-4 bg-red-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg'>
                        {cancelling ? 'Cancelling...' : 'Cancel Plan'}
                    </button>
                </div>
            )}
        </div>
    )
}

export default MySubscription
