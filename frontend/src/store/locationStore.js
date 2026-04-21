import { create } from 'zustand';

const LOCATION_KEY = 'medmarket_location';

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(state) {
  try {
    sessionStorage.setItem(LOCATION_KEY, JSON.stringify({
      city: state.city,
      lat:  state.lat,
      lng:  state.lng,
    }));
  } catch {}
}

const saved = loadSaved();

const useLocationStore = create((set, get) => ({
  city:        saved?.city || '',
  lat:         saved?.lat  || null,
  lng:         saved?.lng  || null,
  detecting:   false,
  error:       null,

  setCity: (city) => {
    const next = { ...get(), city, lat: null, lng: null, error: null };
    set(next);
    persist(next);
  },

  setLocation: (city, lat, lng) => {
    const next = { ...get(), city, lat, lng, error: null, detecting: false };
    set(next);
    persist(next);
  },

  /**
   * Asks the browser for GPS, then reverse-geocodes to a city name
   * using the free Nominatim API (OpenStreetMap) — no API key needed.
   */
  detectLocation: () => {
    if (!navigator.geolocation) {
      set({ error: 'Geolocation is not supported by your browser.', detecting: false });
      return;
    }
    set({ detecting: true, error: null });

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } },
          );
          const data = await res.json();
          // Nominatim returns address.city || address.town || address.village
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            '';
          const next = { ...get(), city, lat, lng, detecting: false, error: null };
          set(next);
          persist(next);
        } catch {
          // Fallback: store coords but no city name
          const next = { ...get(), lat, lng, detecting: false, error: 'Could not resolve city name.' };
          set(next);
          persist(next);
        }
      },
      (err) => {
        const msg =
          err.code === 1 ? 'Location permission denied. Please enter your city manually.' :
          err.code === 2 ? 'Location unavailable. Please enter your city manually.' :
                           'Location request timed out. Please enter your city manually.';
        set({ detecting: false, error: msg });
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  },

  clear: () => {
    const next = { city: '', lat: null, lng: null, error: null, detecting: false };
    set(next);
    try { sessionStorage.removeItem(LOCATION_KEY); } catch {}
  },
}));

export default useLocationStore;
