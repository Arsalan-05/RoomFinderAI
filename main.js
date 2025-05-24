import { initializeAuth } from './auth.js';
import { displayListings, setupListingForm, showListingModal } from './listings.js';
import { setupChat } from './chat.js';
import { initMap } from './map.js';
import { setupAutocomplete } from './autocomplete.js';

const SUPABASE_URL = 'https://fkktwhjybuflxqzopaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZra3R3aGp5YnVmbHhxem9wYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTg5NzQsImV4cCI6MjA2MzA3NDk3NH0.4vdk_ozdi_jNNP1dxpAlGF2Km2detytIhN-lMNXNFHs';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: {
        schema: 'public'
    },
    global: {
        headers: { 'Content-Type': 'application/json' }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await initializeAuth(supabase);
    if (!isAuthenticated) return;

    initMap();
    setupAutocomplete();
    setupListingForm(supabase);
    setupChat(supabase);
    await displayListings(supabase);

    // Real-time subscription to listings
    supabase
        .channel('public:listings')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, (payload) => {
            console.log('New listing added:', payload.new);
            displayListings(supabase);
        })
        .subscribe();

    // Modal close button
    const modal = document.getElementById('listingModal');
    const closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        console.log('Modal closed');
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            console.log('Modal closed by clicking outside');
        }
    });

    // Refresh listings button
    document.querySelector('button[onclick="displayListings()"]').addEventListener('click', () => displayListings(supabase));
});