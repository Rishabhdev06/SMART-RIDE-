import React from 'react'

const WaitingForDriver = (props) => {

    return (
        <div>

            {/* Close button */}
            <h5
                className='p-1 text-center w-[93%] absolute top-0'
                onClick={() => {
                    props.setWaitingForDriver(false)
                }}
            >
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>


            {/* Captain information */}
            <div className='flex items-center justify-between'>

                <i className="ri-car-line text-5xl"></i>

                <div className='text-right'>

                    <h2 className='text-lg font-medium capitalize'>
                        {props.ride?.captain?.fullname?.firstname || 'Captain'}
                    </h2>

                    <h4 className='text-xl font-semibold -mt-1 -mb-1'>
                        {props.ride?.captain?.vehicle?.plate || '---'}
                    </h4>

                    <p className='text-sm text-gray-600 capitalize'>
                        {props.ride?.vehicleType || ''}
                    </p>

                </div>

            </div>


            {/* OTP */}
            <div className='mt-5 bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-center'>

                <p className='text-sm font-medium text-gray-600'>
                    🔐 Ride Verification OTP
                </p>

                <p className='text-3xl font-bold tracking-[0.3em] mt-2'>
                    {props.ride?.otp || '------'}
                </p>

                <p className='text-sm text-gray-600 mt-2'>
                    Tell this OTP to your captain when they arrive.
                </p>

                <p className='text-xs text-red-500 mt-1'>
                    Do not share this OTP before the captain arrives.
                </p>

            </div>


            {/* Ride details */}
            <div className='flex gap-2 justify-between flex-col items-center'>

                <div className='w-full mt-5'>

                    {/* Pickup */}
                    <div className='flex items-center gap-5 p-3 border-b-2'>

                        <i className="ri-map-pin-user-fill"></i>

                        <div>

                            <h3 className='text-lg font-medium'>
                                Pickup
                            </h3>

                            <p className='text-sm -mt-1 text-gray-600'>
                                {props.ride?.pickup}
                            </p>

                        </div>

                    </div>


                    {/* Drop */}
                    <div className='flex items-center gap-5 p-3 border-b-2'>

                        <i className="text-lg ri-map-pin-2-fill"></i>

                        <div>

                            <h3 className='text-lg font-medium'>
                                Drop
                            </h3>

                            <p className='text-sm -mt-1 text-gray-600'>
                                {props.ride?.destination}
                            </p>

                        </div>

                    </div>


                    {/* Subscription */}
                    <div className='flex items-center gap-5 p-3'>

                        <i className="ri-vip-crown-line"></i>

                        <div>

                            <h3 className='text-lg font-medium'>
                                Covered by your plan
                            </h3>

                            <p className='text-sm -mt-1 text-gray-600'>
                                No fare due
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    )
}

export default WaitingForDriver
