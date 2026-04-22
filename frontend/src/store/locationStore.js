import { create } from 'zustand';

const LOCATION_KEY = 'medmarket_location';

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(city, lat, lng) {
  try {
    sessionStorage.setItem(LOCATION_KEY, JSON.stringify({ city, lat, lng }));
  } catch {}
}

const saved = loadSaved();

const useLocationStore = create((set, get) => ({
  city:      saved?.city || '',
  lat:       saved?.lat  || null,
  lng:       saved?.lng  || null,
  detecting: false,
  error:     null,

  setCity: (city) => {
    set({ city, lat: null, lng: null, error: null });
    persist(city, null, null);
  },

  setLocation: (city, lat, lng) => {
    set({ city, lat, lng, error: null, detecting: false });
    persist(city, lat, lng);
  },

  /**
   * GPS → Nominatim reverse-geocode.
   * Always requests a fresh position (maximumAge: 0) so repeated taps
   * always re-resolve — critical for "update my location" use case.
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
          const city =
            data.address?.city    ||
            data.address?.town    ||
            data.address?.village ||
            data.address?.county  ||
            '';
          set({ city, lat, lng, detecting: false, error: null });
          persist(city, lat, lng);
        } catch {
          set({ lat, lng, detecting: false, error: 'Could not resolve city name. Please type your city.' });
          persist(get().city, lat, lng);
        }
      },
      (err) => {
        const msg =
          err.code === 1 ? 'Location permission denied. Please type your city manually.' :
          err.code === 2 ? 'Location unavailable. Please type your city manually.' :
                           'Location request timed out. Please type your city manually.';
        set({ detecting: false, error: msg });
      },
      { timeout: 10000, maximumAge: 0 },   // ← always fresh, no cache
    );
  },

  clear: () => {
    set({ city: '', lat: null, lng: null, error: null, detecting: false });
    try { sessionStorage.removeItem(LOCATION_KEY); } catch {}
  },
}));

export default useLocationStore;
