import React, { useState, useEffect } from 'react'
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup
} from 'react-leaflet'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const LiveTracking = () => {

    const [currentPosition, setCurrentPosition] = useState({
        lat: 28.6139,
        lng: 77.2090
    })

    useEffect(() => {

        if (!navigator.geolocation) {
            console.log('Geolocation is not supported')
            return
        }

        const updatePosition = (position) => {

            const { latitude, longitude } =
                position.coords

            console.log(
                'Position updated:',
                latitude,
                longitude
            )

            setCurrentPosition({
                lat: latitude,
                lng: longitude
            })
        }

        navigator.geolocation.getCurrentPosition(
            updatePosition,
            (error) => {
                console.log(
                    'Location error:',
                    error.message
                )
            }
        )

        const watchId =
            navigator.geolocation.watchPosition(
                updatePosition,
                (error) => {
                    console.log(
                        'Location error:',
                        error.message
                    )
                }
            )

        return () => {
            navigator.geolocation.clearWatch(
                watchId
            )
        }

    }, [])

    const defaultIcon =
        new L.Icon({
            iconUrl: markerIcon,
            shadowUrl: markerShadow,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        })

    return (

        <MapContainer
            className="relative z-0"
            center={currentPosition}
            zoom={15}
            style={{
                width: '100%',
                height: '100%'
            }}
        >

            <TileLayer
                url={`https://maps.geoapify.com/v1/tile/osm-bright-smooth-slategray/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`}
                attribution='© OpenStreetMap contributors'
            />

            <Marker
                position={currentPosition}
                icon={defaultIcon}
            >
                <Popup>
                    You are here
                </Popup>
            </Marker>

        </MapContainer>

    )
}

export default LiveTracking
