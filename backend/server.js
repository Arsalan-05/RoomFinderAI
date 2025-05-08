const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Google Maps API key
const GOOGLE_API_KEY = 'AIzaSyBzE8cPfeO5YkmpJFc8SLtVsz_eGB-wYYM'; // Replace with your valid key

// Override map for problematic Canadian cities
const locationOverrides = {
    'saint john': 'saint-john',
    'saint john, nb': 'saint-john',
    'quebec city': 'quebec',
    'quebec city, qc': 'quebec',
    'st johns': 'st-johns',
    'st johns, nl': 'st-johns',
    'st catharines': 'st-catharines',
    'st catharines, on': 'st-catharines',
    'fort st john': 'fort-st-john',
    'fort st john, bc': 'fort-st-john',
};

// Helper function to normalize city name to Marketplace slug
function normalizeCityToSlug(city) {
    if (!city) return '';
    const lowerCity = city.toLowerCase();
    return locationOverrides[lowerCity] || lowerCity
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ''); // Remove spaces
}

// Helper function to get city slug via Google Maps Geocoding API
async function getCitySlug(location) {
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&components=country:CA&key=${GOOGLE_API_KEY}`
        );
        if (response.data.status !== 'OK') {
            throw new Error(`Geocoding API error: ${response.data.status}`);
        }
        const cityComponent = response.data.results[0]?.address_components.find(c => c.types.includes('locality'));
        const city = cityComponent ? cityComponent.short_name : null;
        const slug = city ? normalizeCityToSlug(city) : location.toLowerCase().replace(/[^a-z0-9]/g, '');
        console.log(`Geocoded location: ${location} -> City: ${city || 'none'}, Slug: ${slug || 'none'}`);
        return slug;
    } catch (error) {
        console.error('Geocoding error in getCitySlug:', error.message);
        // Fallback to raw location if geocoding fails
        return location.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
}

// Helper function to normalize city and province for Kijiji URL
function normalizeForKijiji(city, province) {
    if (!city) return { normalizedCity: '', normalizedProvince: '' };
    const normalizedCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedProvince = province ? province.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    return { normalizedCity, normalizedProvince };
}

// Helper function to get city and province for Kijiji
async function getCityDetails(location) {
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&components=country:CA&key=${GOOGLE_API_KEY}`
        );
        if (response.data.status !== 'OK') {
            throw new Error(`Geocoding API error: ${response.data.status}`);
        }
        const cityComponent = response.data.results[0]?.address_components.find(c => c.types.includes('locality'));
        const provinceComponent = response.data.results[0]?.address_components.find(c => c.types.includes('administrative_area_level_1'));
        const city = cityComponent ? cityComponent.short_name : null;
        const province = provinceComponent ? provinceComponent.short_name : null;
        const { normalizedCity, normalizedProvince } = normalizeForKijiji(city, province);
        console.log(`Geocoded: ${location} -> City: ${city || 'none'}, Normalized: ${normalizedCity || 'none'}, Province: ${province || 'none'}, Normalized Province: ${normalizedProvince || 'none'}`);
        return { city: normalizedCity, province: normalizedProvince };
    } catch (error) {
        console.error('Geocoding error in getCityDetails:', error.message);
        return { city: location.toLowerCase().replace(/[^a-z0-9]/g, ''), province: '' };
    }
}

// Helper function to generate Kijiji search URL
async function generateKijijiUrl({ location, price, size, amenities, roomType }) {
    const { city, province } = await getCityDetails(location);
    const priceNum = parseInt(price);
    const sizeNum = size ? parseInt(size) : null;

    const minPrice = Math.floor(priceNum * 0.9);
    const maxPrice = Math.ceil(priceNum * 1.1);

    const amenityKeywords = amenities
        ? amenities.split(',').map(a => a.trim().replace(/\s+/g, '-')).join('-')
        : '';
    let query = roomType ? roomType.toLowerCase() : 'apartment';
    if (amenityKeywords) query += `-${amenityKeywords}`;
    if (sizeNum) query += `-${sizeNum}-sq-ft`;

    const baseUrl = 'https://www.kijiji.ca/b-apartments-condos';
    const encodedQuery = encodeURIComponent(query);
    const addressParam = encodeURIComponent(location);
    const kijijiUrl = `${baseUrl}/${encodedQuery}/k0c37?price=${minPrice}__${maxPrice}&address=${addressParam}`;
    console.log(`Generated Kijiji URL: ${kijijiUrl}`);
    return kijijiUrl;
}

// Helper function to generate Facebook Marketplace URL
async function generateMarketplaceUrl({ location, price, size, amenities, roomType }) {
    const normalizedLocation = await getCitySlug(location);
    console.log(`Input location: ${location}, Normalized: ${normalizedLocation || 'none'}`);

    const encodedLocation = encodeURIComponent(normalizedLocation);
    const priceNum = parseInt(price);
    const sizeNum = size ? parseInt(size) : null;

    const minPrice = Math.floor(priceNum * 0.9);
    const maxPrice = Math.ceil(priceNum * 1.1);

    const amenityKeywords = amenities
        ? amenities.split(',').map(a => encodeURIComponent(a.trim())).join('%20')
        : '';

    let query = roomType ? roomType.toLowerCase() : 'apartment';
    if (amenityKeywords) query += `%20${amenityKeywords}`;
    if (sizeNum) query += `%20${sizeNum}%20sq%20ft`;
    if (!normalizedLocation) query += `%20${encodeURIComponent(location)}`;

    const baseUrl = 'https://www.facebook.com/marketplace';
    const locationPath = normalizedLocation ? `/${encodedLocation}` : '';
    const marketplaceUrl = `${baseUrl}${locationPath}/search?minPrice=${minPrice}&maxPrice=${maxPrice}&query=${query}`;
    console.log(`Generated Marketplace URL: ${marketplaceUrl}`);
    return marketplaceUrl;
}

// API Endpoint for Kijiji URL
app.post('/api/predict/kijiji', async (req, res) => {
    try {
        console.log('Received Kijiji request:', req.body);
        const { location, price, size, amenities, roomType } = req.body;
        if (!location || !price) {
            return res.status(400).json({ error: 'Location and price are required' });
        }

        const kijijiUrl = await generateKijijiUrl({ location, price, size, amenities, roomType });
        if (!kijijiUrl) {
            throw new Error('Failed to generate Kijiji URL');
        }
        res.json({ url: kijijiUrl });
    } catch (error) {
        console.error('Error in /api/predict/kijiji:', error.message);
        res.status(500).json({ error: `Failed to generate Kijiji URL: ${error.message}` });
    }
});

// API Endpoint for Facebook Marketplace URL
app.post('/api/predict/marketplace', async (req, res) => {
    try {
        console.log('Received Marketplace request:', req.body);
        const { location, price, size, amenities, roomType } = req.body;
        if (!location || !price) {
            return res.status(400).json({ error: 'Location and price are required' });
        }

        const marketplaceUrl = await generateMarketplaceUrl({ location, price, size, amenities, roomType });
        if (!marketplaceUrl) {
            throw new Error('Failed to generate Marketplace URL');
        }
        res.json({ url: marketplaceUrl });
    } catch (error) {
        console.error('Error in /api/predict/marketplace:', error.message);
        res.status(500).json({ error: `Failed to generate Marketplace URL: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});