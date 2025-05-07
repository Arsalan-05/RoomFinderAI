const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to get normalized location using Google Geocoding API
async function getNormalizedLocation(location) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('Google API key is not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
    
    try {
        const response = await axios.get(url);
        const { results, status } = response.data;

        console.log(`Geocoding response for "${location}":`, { status, results: results.length });

        if (status !== 'OK' || results.length === 0) {
            throw new Error('Unable to geocode location');
        }

        // Extract city and state for Marketplace
        const addressComponents = results[0].address_components;
        let city = '';
        let state = '';

        for (const component of addressComponents) {
            if (component.types.includes('locality')) {
                city = component.short_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
                state = component.short_name;
            }
        }

        // Fallback to state if city is not found
        if (!city && state) {
            city = state;
        }

        if (!city) {
            throw new Error('Could not determine city or region from location');
        }

        // Normalize for Facebook Marketplace (e.g., "New York, NY" -> "new-york-ny")
        const normalized = `${city.toLowerCase()}${state ? '-' + state.toLowerCase() : ''}`.replace(/\s+/g, '-');
        console.log(`Normalized location for "${location}": ${normalized}`);
        return normalized;
    } catch (error) {
        console.error(`Geocoding error for "${location}":`, error.message);
        throw new Error(`Geocoding error: ${error.message}`);
    }
}

// Helper function to predict and generate Marketplace URL
function generateMarketplaceUrl({ normalizedLocation, price, size, amenities, bedrooms = null, radius = 10 }) {
    // Normalize inputs
    const priceNum = parseInt(price);
    const sizeNum = parseInt(size);

    // Predict price range (±10% of input price)
    const minPrice = Math.floor(priceNum * 0.9);
    const maxPrice = Math.ceil(priceNum * 1.1);

    // Map amenities to Marketplace keywords
    const amenityMap = {
        'wi-fi': 'wifi',
        'parking': 'parking',
        'gym': 'gym',
        'pool': 'pool',
        'laundry': 'washer-dryer'
    };
    let amenityKeywords = '';
    if (amenities) {
        const amenitiesArray = amenities.split(',').map(a => a.trim().toLowerCase());
        amenityKeywords = amenitiesArray
            .map(a => amenityMap[a] || a)
            .map(encodeURIComponent)
            .join('%20');
    }

    // Construct query
    let query = 'apartment';
    if (amenityKeywords) query += `%20${amenityKeywords}`;
    if (sizeNum) query += `%20${sizeNum}sqft`;

    // Facebook Marketplace base URL
    const baseUrl = 'https://www.facebook.com/marketplace';
    let searchUrl = `${baseUrl}/${normalizedLocation}/search`;

    // Add query parameters
    const params = new URLSearchParams();
    params.append('minPrice', minPrice);
    params.append('maxPrice', maxPrice);
    params.append('query', query);
    params.append('radiusMiles', radius);
    params.append('propertyType', 'apartment_condo');
    if (bedrooms) params.append('bedrooms', bedrooms);

    searchUrl += `?${params.toString()}`;
    console.log(`Generated Marketplace URL: ${searchUrl}`);
    return searchUrl;
}

// API Endpoint to predict and generate URL
app.post('/api/predict', async (req, res) => {
    try {
        const { location, price, size, amenities, bedrooms } = req.body;
        if (!location || !price || !size) {
            return res.status(400).json({ error: 'Location, price, and size are required' });
        }

        // Get normalized location using Google Geocoding API
        const normalizedLocation = await getNormalizedLocation(location);

        // Generate Marketplace URL with filters
        const marketplaceUrl = generateMarketplaceUrl({ 
            normalizedLocation, 
            price, 
            size, 
            amenities, 
            bedrooms,
            radius: 10
        });

        res.json({ url: marketplaceUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});