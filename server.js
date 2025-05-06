const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to predict and generate Marketplace URL
function generateMarketplaceUrl({ location, price, size, amenities }) {
    // Norlize inputs for Marketplace search
    const normalizedLocation = encodeURIComponent(location.trim().replace(/\s+/g, '-')); // e.g., "Downtown NYC" -> "Downtown-NYC"
    const priceNum = parseInt(price);
    const sizeNum = parseInt(size);

    // Predict price range (e.g., ±10% of input price)
    const minPrice = Math.floor(priceNum * 0.9);
    const maxPrice = Math.ceil(priceNum * 1.1);

    // Predict size range (e.g., ±50 sq ft)
    const minSize = Math.floor(sizeNum - 50);
    const maxSize = Math.ceil(sizeNum + 50);

    // Convert amenities to Marketplace keywords (simple mapping)
    const amenityKeywords = amenities
        ? amenities.split(',').map(a => encodeURIComponent(a.trim())).join('%20')
        : '';

    // Construct Marketplace search URL
    // Example: https://www.facebook.com/marketplace/nyc/search?minPrice=1000&maxPrice=1500&query=apartment%20wifi
    let query = 'apartment'; // Base query for rooms/apartments
    if (amenityKeywords) query += `%20${amenityKeywords}`;

    const baseUrl = 'https://www.facebook.com/marketplace';
    const searchUrl = `${baseUrl}/${normalizedLocation}/search?minPrice=${minPrice}&maxPrice=${maxPrice}&query=${query}`;

    return searchUrl;
}

// API Endpoint to predict and generate URL
app.post('/api/predict', (req, res) => {
    try {
        const { location, price, size, amenities } = req.body;
        if (!location || !price || !size) {
            return res.status(400).json({ error: 'Location, price, and size are required' });
        }

        const marketplaceUrl = generateMarketplaceUrl({ location, price, size, amenities });
        res.json({ url: marketplaceUrl });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});