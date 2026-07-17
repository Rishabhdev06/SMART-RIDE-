import React from 'react'

const vehicleCopy = {
    car: {
        title: 'Smart Ride Car',
        blurb: 'Comfortable car pickup & drop, included in your plan',
        seats: 4
    },
    moto: {
        title: 'Smart Ride Moto',
        blurb: 'Quick motorcycle pickup & drop, included in your plan',
        seats: 1
    },
    auto: {
        title: 'Smart Ride Auto',
        blurb: 'Affordable auto pickup & drop, included in your plan',
        seats: 3
    }
}

const VehiclePanel = (props) => {
    const vehicleType = props.subscription?.plan?.vehicleType
    const copy = vehicleCopy[ vehicleType ] || vehicleCopy.car

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setVehiclePanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-1'>Your ride is on us</h3>
            <p className='text-sm text-gray-600 mb-5'>This trip is covered by your {props.subscription?.plan?.name} subscription.</p>

            <div onClick={() => {
                props.setConfirmRidePanel(true)
                props.setVehiclePanel(false)
            }} className='flex border-2 border-black mb-2 rounded-xl w-full p-3 items-center justify-between'>
                <i className="ri-car-line text-4xl"></i>
                <div className='ml-2 w-1/2'>
                    <h4 className='font-medium text-base'>{copy.title} <span><i className="ri-user-3-fill"></i>{copy.seats}</span></h4>
                    <h5 className='font-medium text-sm'>2 mins away</h5>
                    <p className='font-normal text-xs text-gray-600'>{copy.blurb}</p>
                </div>
                <div className='text-right'>
                    <h2 className='text-lg font-semibold'>{props.subscription?.ridesRemaining}</h2>
                    <p className='text-xs text-gray-500'>rides left</p>
                </div>
            </div>
        </div>
    )
}

export default VehiclePanel
