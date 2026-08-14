import React, { useState, useEffect } from 'react'
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    lat: 28.6139,
    lng: 77.2090
};

const LiveTracking = () => {
    const [ currentPosition, setCurrentPosition ] = useState(center);

    useEffect(() => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported')
            return
        }

        const updatePosition = (position) => {
            const { latitude, longitude } = position.coords
            console.log('Position updated:', latitude, longitude)
            setCurrentPosition({
                lat: latitude,
                lng: longitude
            })
        }

        navigator.geolocation.getCurrentPosition(updatePosition, (error) => {
            console.log('Location error:', error.message)
        })

        const watchId = navigator.geolocation.watchPosition(updatePosition, (error) => {
            console.log('Location error:', error.message)
        })

        return () => {
            navigator.geolocation.clearWatch(watchId)
        }
    }, [])

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentPosition}
                zoom={15}
                options={{
                    streetViewControl: true,
                    fullscreenControl: false,
                }}
            >
                <Marker position={currentPosition} />
            </GoogleMap>
        </LoadScript>
    )
}

export default LiveTracking
