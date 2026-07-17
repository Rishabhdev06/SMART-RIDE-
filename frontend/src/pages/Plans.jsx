import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { SubscriptionDataContext } from '../context/SubscriptionContext'
import 'remixicon/fonts/remixicon.css'

const vehicleLabel = {
    auto: 'Auto',
    car: 'Car',
    moto: 'Motorcycle'
}

const Plans = () => {
    const [ plans, setPlans ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const [ subscribingId, setSubscribingId ] = useState(null)
    const [ error, setError ] = useState('')

    const { subscription, setSubscription } = useContext(SubscriptionDataContext)
    const navigate = useNavigate()

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_BASE_URL}/plans`)
            .then(res => setPlans(res.data))
            .catch(() => setError('Could not load plans right now.'))
            .finally(() => setLoading(false))
    }, [])

    const subscribe = async (planId) => {
        setError('')
        setSubscribingId(planId)
        try {
            const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/subscriptions/subscribe`, { planId }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            setSubscription(res.data)
            navigate('/subscription')
        } catch (err) {
            setError(err.response?.data?.message || 'Could not subscribe to this plan.')
        } finally {
            setSubscribingId(null)
        }
    }

    return (
        <div className='p-6 h-screen overflow-y-auto'>
            <div className='flex items-center justify-between mb-2'>
                <h1 className='text-2xl font-bold'>Smart Ride Plans</h1>
                <i className='ri-close-line text-2xl cursor-pointer' onClick={() => navigate('/home')}></i>
            </div>
            <p className='text-gray-600 mb-6'>Pick a monthly pickup &amp; drop plan. Every ride you take is included - no per-trip fare.</p>

            {subscription?.status === 'active' && (
                <div className='bg-green-50 border border-green-300 text-green-800 rounded-lg p-3 mb-4'>
                    You're currently on the <strong>{subscription.plan?.name}</strong> plan with {subscription.ridesRemaining} pickups &amp; drops left this month.
                </div>
            )}

            {error && <div className='bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 mb-4'>{error}</div>}

            {loading ? (
                <p>Loading plans...</p>
            ) : (
                <div className='flex flex-col gap-4'>
                    {plans.map(plan => (
                        <div key={plan._id} className='border-2 rounded-xl p-4'>
                            <div className='flex items-center justify-between'>
                                <h2 className='text-xl font-semibold'>{plan.name}</h2>
                                <span className='text-xl font-bold'>₹{plan.pricePerMonth}<span className='text-sm font-normal text-gray-500'>/mo</span></span>
                            </div>
                            <p className='text-sm text-gray-600 mt-1'>{plan.description}</p>
                            <div className='flex gap-4 mt-3 text-sm text-gray-700'>
                                <span><i className='ri-repeat-line mr-1'></i>{plan.ridesPerMonth} pickups &amp; drops / month</span>
                                <span><i className='ri-car-line mr-1'></i>{vehicleLabel[ plan.vehicleType ] || plan.vehicleType}</span>
                            </div>
                            <button
                                disabled={subscribingId === plan._id || subscription?.status === 'active'}
                                onClick={() => subscribe(plan._id)}
                                className='w-full mt-4 bg-black disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg'>
                                {subscription?.status === 'active' ? 'Plan active elsewhere' : (subscribingId === plan._id ? 'Subscribing...' : 'Subscribe')}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Plans
