import React, { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY

const LiveTracking = () => {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const markerRef = useRef(null)
    const accuracyCircleRef = useRef(null)
    const watchIdRef = useRef(null)

    useEffect(() => {
        if (mapRef.current) return

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_KEY}`,
            center: [ 77.2090, 28.6139 ],
            zoom: 15,
            attributionControl: false
        })

        mapRef.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

        // "Blue dot" marker element, styled like Google Maps' current-location marker
        const el = document.createElement('div')
        el.style.width = '18px'
        el.style.height = '18px'
        el.style.borderRadius = '50%'
        el.style.background = '#4285F4'
        el.style.border = '3px solid white'
        el.style.boxShadow = '0 0 0 2px rgba(66,133,244,0.35), 0 1px 4px rgba(0,0,0,0.4)'

        markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([ 77.2090, 28.6139 ])
            .addTo(mapRef.current)

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current)
            }
            mapRef.current?.remove()
            mapRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported')
            return
        }

        const updatePosition = (position) => {
            const { latitude, longitude } = position.coords
            console.log('Position updated:', latitude, longitude)

            if (markerRef.current) {
                markerRef.current.setLngLat([ longitude, latitude ])
            }

            if (mapRef.current) {
                mapRef.current.easeTo({
                    center: [ longitude, latitude ],
                    zoom: Math.max(mapRef.current.getZoom(), 15),
                    duration: 800
                })
            }
        }

        navigator.geolocation.getCurrentPosition(updatePosition, (error) => {
            console.log('Location error:', error.message)
        })

        watchIdRef.current = navigator.geolocation.watchPosition(updatePosition, (error) => {
            console.log('Location error:', error.message)
        })

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current)
            }
        }
    }, [])

    return (
        <div
            ref={mapContainerRef}
            className="relative z-0"
            style={{ width: '100%', height: '100%' }}
        />
    )
}

export default LiveTracking
