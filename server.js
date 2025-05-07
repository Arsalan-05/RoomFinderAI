const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Google Maps API key (replace with your own)
const GOOGLE_API_KEY = 'AIzaSyBzE8cPfeO5YkmpJFc8SLtVsz_eGB-wYYM'; // Replace with your API key from https://console.cloud.google.com/

// Helper function to normalize city and province for Kijiji URL
function normalizeForKijiji(city, province) {
  if (!city) return { normalizedCity: '', normalizedProvince: '' };
  const normalizedCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedProvince = province ? province.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return { normalizedCity, normalizedProvince };
}

// Helper function to get city and province via Google Maps Geocoding API
async function getCityDetails(location) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&components=continent:North%20America&key=${GOOGLE_API_KEY}`
    );
    const cityComponent = response.data.results[0]?.address_components.find(c => c.types.includes('locality'));
    const provinceComponent = response.data.results[0]?.address_components.find(c => c.types.includes('administrative_area_level_1'));
    const city = cityComponent ? cityComponent.short_name : null;
    const province = provinceComponent ? provinceComponent.short_name : null;
    const { normalizedCity, normalizedProvince } = normalizeForKijiji(city, province);
    console.log(`Geocoded: ${location} -> City: ${city || 'none'}, Normalized: ${normalizedCity || 'none'}, Province: ${province || 'none'}, Normalized Province: ${normalizedProvince || 'none'}`);
    return { city: normalizedCity, province: normalizedProvince };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return { city: '', province: '' };
  }
}

// Helper function to generate Kijiji search URL
async function generateKijijiUrl({ location, price, size, amenities }) {
  const { city, province } = await getCityDetails(location);
  const priceNum = parseInt(price);
  const sizeNum = size ? parseInt(size) : null;

  // Predict price range (±10% of input price)
  const minPrice = Math.floor(priceNum * 0.9);
  const maxPrice = Math.ceil(priceNum * 1.1);

  // Convert amenities to keywords
  const amenityKeywords = amenities
    ? amenities.split(',').map(a => a.trim().replace(/\s+/g, '-')).join('-')
    : '';

  // Base query
  let query = 'apartment';
  if (amenityKeywords) query += `-${amenityKeywords}`;
  if (sizeNum) query += `-${sizeNum}-sq-ft`;

  // Construct Kijiji URL
  const baseUrl = 'https://www.kijiji.ca/b-apartments-condos';
  const encodedQuery = encodeURIComponent(query);
  // Use the address parameter for location filtering
  const addressParam = encodeURIComponent(location);
  let locationPath = '';
  if (city && province) {
    locationPath = `/${city}-${province}`;
  }
  return `${baseUrl}${locationPath}/${encodedQuery}/k0c37?price=${minPrice}__${maxPrice}&address=${addressParam}`;
}

// API Endpoint to predict and generate URL
app.post('/api/predict', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { location, price, size, amenities } = req.body;
    if (!location || !price) {
      return res.status(400).json({ error: 'Location and price are required' });
    }

    const kijijiUrl = await generateKijijiUrl({ location, price, size, amenities });
    console.log('Generated URL:', kijijiUrl);
    res.json({ url: kijijiUrl });
  } catch (error) {
    console.error('Error in /api/predict:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});