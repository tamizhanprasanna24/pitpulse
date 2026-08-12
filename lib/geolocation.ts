export interface GpsLocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
  isHighAccuracy?: boolean;
  error?: string | null;
}

/**
 * Robust & Secure Geolocation Getter
 * 1. Tries high accuracy position request with 8s timeout
 * 2. On timeout or position unavailable, automatically falls back to low accuracy (WiFi/Cell/IP location)
 * 3. Sanitizes coordinates to 6 decimal places for security & privacy
 */
export async function getSecureGpsLocation(
  fallbackDefault = { lat: 28.6139, lng: 77.2090 }
): Promise<GpsLocationResult> {
  if (typeof window === 'undefined' || !navigator?.geolocation) {
    return { ...fallbackDefault, accuracy: 1000, isHighAccuracy: false, error: 'Geolocation is not supported by your browser.' };
  }

  return new Promise((resolve) => {
    // Attempt 1: High Accuracy
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        resolve({
          lat,
          lng,
          accuracy: Math.round(pos.coords.accuracy),
          isHighAccuracy: true,
          error: null,
        });
      },
      (err1) => {
        // Attempt 2: Low Accuracy Fallback (Network/Wi-Fi positioning)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            resolve({
              lat,
              lng,
              accuracy: Math.round(pos.coords.accuracy),
              isHighAccuracy: false,
              error: null,
            });
          },
          (err2) => {
            let errMsg = 'Location access unavailable. Defaulting to Delhi region.';
            if (err1.code === 1 || err2.code === 1) {
              errMsg = 'GPS Permission Denied. Please allow location access in browser settings.';
            }
            resolve({
              ...fallbackDefault,
              accuracy: 1000,
              isHighAccuracy: false,
              error: errMsg,
            });
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 10000 }
    );
  });
}
