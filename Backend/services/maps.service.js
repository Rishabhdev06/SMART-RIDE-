const axios = require('axios');
const captainModel = require('../models/captain.model');

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;

module.exports.getAddressCoordinate = async (address) => {
    if (!address) {
        throw new Error('Address is required');
    }

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_KEY}`;

    try {
        const response = await axios.get(url);
        const feature = response.data.features && response.data.features[ 0 ];

        if (!feature) {
            throw new Error('Unable to find coordinates for this address');
        }

        const [ lng, ltd ] = feature.geometry.coordinates;
        return { ltd, lng };
    } catch (error) {
        throw new Error('Unable to fetch coordinates');
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const originCoords = await module.exports.getAddressCoordinate(origin);
    const destCoords = await module.exports.getAddressCoordinate(destination);

    const url = `https://api.geoapify.com/v1/routing?waypoints=${originCoords.ltd},${originCoords.lng}|${destCoords.ltd},${destCoords.lng}&mode=drive&apiKey=${GEOAPIFY_KEY}`;

    try {
        const response = await axios.get(url);
        const feature = response.data.features && response.data.features[ 0 ];

        if (!feature) {
            throw new Error('Unable to find a route between these locations');
        }

        return {
            distance: { value: feature.properties.distance },   // meters
            duration: { value: feature.properties.time }         // seconds
        };
    } catch (error) {
        throw new Error('Unable to fetch distance and time');
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('Query is required');
    }

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&apiKey=${GEOAPIFY_KEY}`;

    try {
        const response = await axios.get(url);
        const suggestions = (response.data.features || [])
            .map(f => f.properties.formatted)
            .filter(Boolean);

        return suggestions;
    } catch (error) {
        throw new Error('Unable to fetch suggestions');
    }
}
function getDistanceInKm(lat1, lng1, lat2, lng2) {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
const captains = await captainModel.find({
        'location.ltd': { $exists: true, $ne: null },
        'location.lng': { $exists: true, $ne: null }
    });

    return captains.filter(captain => {
        const distance = getDistanceInKm(ltd, lng, captain.location.ltd, captain.location.lng);
        return distance <= radius;
    });
}
 
