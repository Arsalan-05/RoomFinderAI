let map;
let markers = [];

function initMap() {
    map = L.map('map').setView([43.6532, -79.3832], 10); // Default: Toronto
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);
    console.log('Map initialized');
}

async function geocodeLocation(location) {
    try {
        const query = encodeURIComponent(location);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
        const data = await response.json();
        console.log('Geocode response for', location, ':', data);
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        console.warn('No coordinates found for location:', location);
        return null;
    } catch (error) {
        console.error('Error geocoding location:', location, error);
        return null;
    }
}

async function updateMap(listings) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    const validCoordinates = [];

    for (const listing of listings) {
        if (!listing.location) {
            console.warn('Listing missing location:', listing);
            continue;
        }

        const coords = await geocodeLocation(listing.location);
        if (coords) {
            const marker = L.marker([coords.lat, coords.lon])
                .addTo(map)
                .bindPopup(`<b>${listing.title}</b><br>$${listing.price.toLocaleString()}/mo`);
            markers.push(marker);
            validCoordinates.push([coords.lat, coords.lon]);
            console.log('Added marker for', listing.location, 'at', coords);
        }
    }

    if (validCoordinates.length > 0) {
        const bounds = L.latLngBounds(validCoordinates);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
        map.setView([43.6532, -79.3832], 10);
    }
    console.log('Map updated with', markers.length, 'markers');
}

export { initMap, updateMap };