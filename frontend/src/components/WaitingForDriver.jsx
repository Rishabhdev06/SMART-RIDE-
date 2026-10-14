
import React from 'react';

const WaitingForDriver = (props) => {
    const ride = props.ride;
    const otp = ride?.otp;

    console.log('🚕 WaitingForDriver RIDE:', ride);
    console.log('🔐 WaitingForDriver OTP:', otp);

    return (
        <div className="relative w-full min-w-0 box-border">

            {/* Close button */}
            <div className="sticky top-0 z-20 -mx-3 mb-3 flex justify-center bg-white py-1">
                <button
                    type="button"
                    aria-label="Close ride details"
                    className="flex w-full justify-center"
                    onClick={() => props.setWaitingForDriver(false)}
                >
                    <i className="text-3xl text-gray-400 ri-arrow-down-wide-line"></i>
                </button>
            </div>

            {/* Captain information */}
            <div className="flex min-w-0 items-center justify-between gap-3">

                <i className="ri-car-line shrink-0 text-5xl"></i>

                <div className="min-w-0 flex-1 text-right">
                    <h2 className="break-words text-lg font-medium capitalize">
                        {ride?.captain?.fullname?.firstname || 'Captain'}
                    </h2>

                    <h4 className="break-words text-xl font-semibold">
                        {ride?.captain?.vehicle?.plate || '---'}
                    </h4>

                    <p className="text-sm text-gray-600 capitalize">
                        {ride?.vehicleType || ''}
                    </p>
                </div>

            </div>

            {/* OTP card */}
            <div className="mt-5 w-full min-w-0 box-border rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-center">

                <p className="text-sm font-medium text-gray-600">
                    🔐 Ride Verification OTP
                </p>

                <p className="mt-2 break-words font-mono text-3xl font-bold tracking-[0.2em]">
                    {otp !== undefined && otp !== null && otp !== ''
                        ? otp
                        : '------'}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                    Tell this OTP to your captain when they arrive.
                </p>

                <p className="mt-1 text-xs text-red-500">
                    Do not share this OTP before the captain arrives.
                </p>

            </div>

            {/* Ride details */}
            <div className="mt-5 w-full min-w-0">

                {/* Pickup */}
                <div className="flex min-w-0 items-center gap-4 border-b-2 p-3">

                    <i className="ri-map-pin-user-fill shrink-0 text-lg"></i>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-medium">
                            Pickup
                        </h3>

                        <p className="break-words text-sm text-gray-600">
                            {ride?.pickup || 'Pickup unavailable'}
                        </p>
                    </div>

                </div>

                {/* Drop */}
                <div className="flex min-w-0 items-center gap-4 border-b-2 p-3">

                    <i className="ri-map-pin-2-fill shrink-0 text-lg"></i>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-medium">
                            Drop
                        </h3>

                        <p className="break-words text-sm text-gray-600">
                            {ride?.destination || 'Destination unavailable'}
                        </p>
                    </div>

                </div>

                {/* Subscription */}
                <div className="flex min-w-0 items-center gap-4 p-3">

                    <i className="ri-vip-crown-line shrink-0 text-lg"></i>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-medium">
                            Covered by your plan
                        </h3>

                        <p className="text-sm text-gray-600">
                            No fare due
                        </p>
                    </div>

                </div>

            </div>

        </div>
    );
};

export default WaitingForDriver;

