/**
 * Location Service: Device GPS, Reverse Geocoding, Distance calculation
 * Features resilient multi-tier GPS acquisition, reverse geocoding proxy, and fallback.
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  locality?: string;
  city?: string;
  accuracy?: number;
  isApproximate?: boolean;
  source?: "gps_high_accuracy" | "gps_standard" | "ip_approximate" | "fallback_hub";
}

// Haversine formula to calculate distance between two coordinates in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Estimate driving ETA in minutes assuming average city emergency speed of 35 km/h
export function estimateDrivingEtaMinutes(distanceKm: number): number {
  const speedKmH = 35;
  const minutes = Math.ceil((distanceKm / speedKmH) * 60);
  return Math.max(minutes + 2, 3); // minimum 3 minutes
}

export const locationService = {
  /**
   * Resilient Device GPS acquisition with multi-tier fallback:
   * 1. Try High Accuracy GPS (8s)
   * 2. Fallback to Standard/Cellular/Wi-Fi GPS (8s, maxAge 5 min)
   * 3. Fallback to IP-based Geolocation endpoint
   */
  async getCurrentPosition(options?: {
    forceHighAccuracy?: boolean;
    timeoutMs?: number;
  }): Promise<GeoLocation> {
    const hasNavigator = typeof navigator !== "undefined" && "geolocation" in navigator;

    if (!hasNavigator) {
      return locationService.getIpFallbackLocation();
    }

    const tryGps = (highAccuracy: boolean, timeout: number, maxAge: number): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: maxAge,
        });
      });
    };

    let pos: GeolocationPosition | null = null;
    let detectionSource: GeoLocation["source"] = "gps_high_accuracy";

    // Tier 1: Try High Accuracy GPS
    try {
      pos = await tryGps(true, options?.timeoutMs || 8000, 30000);
      detectionSource = "gps_high_accuracy";
    } catch {
      // Tier 2: Try Standard Accuracy (works on desktop Wi-Fi & indoor phones)
      if (!options?.forceHighAccuracy) {
        try {
          pos = await tryGps(false, 8000, 300000);
          detectionSource = "gps_standard";
        } catch {
          pos = null;
        }
      }
    }

    // Tier 3: IP Geolocation Fallback if GPS blocked or unavailable
    if (!pos) {
      return locationService.getIpFallbackLocation();
    }

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    // Resolve address from server-side reverse geocoding route
    try {
      const geocoded = await locationService.reverseGeocode(lat, lng);
      return {
        latitude: lat,
        longitude: lng,
        locality: geocoded.locality,
        city: geocoded.city,
        accuracy,
        isApproximate: false,
        source: detectionSource,
      };
    } catch {
      return {
        latitude: lat,
        longitude: lng,
        locality: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
        city: "Current GPS",
        accuracy,
        isApproximate: false,
        source: detectionSource,
      };
    }
  },

  /**
   * Watch user GPS position in real-time
   */
  watchPosition(
    onSuccess: (loc: GeoLocation) => void,
    onError?: (err: any) => void
  ): () => void {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return () => {};
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onSuccess({
          latitude: lat,
          longitude: lng,
          accuracy: pos.coords.accuracy,
          isApproximate: false,
          source: "gps_high_accuracy",
        });
      },
      onError,
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  },

  /**
   * Fallback to IP-based location via server endpoint
   */
  async getIpFallbackLocation(): Promise<GeoLocation> {
    try {
      const res = await fetch("/api/v1/location/ip");
      if (res.ok) {
        const data = await res.json();
        return {
          latitude: data.lat || 22.5804,
          longitude: data.lng || 88.4173,
          locality: data.area || "Salt Lake, Sector V",
          city: data.city || "Kolkata",
          accuracy: 5000,
          isApproximate: true,
          source: "ip_approximate",
        };
      }
    } catch {
      // ignore
    }

    // Default seed healthcare hub
    return {
      latitude: 22.5804,
      longitude: 88.4173,
      locality: "Salt Lake, Sector V",
      city: "Kolkata",
      accuracy: 10000,
      isApproximate: true,
      source: "fallback_hub",
    };
  },

  /**
   * Reverse geocode lat/lng to human-readable address via server proxy
   */
  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{ locality: string; city: string; formatted_address?: string }> {
    try {
      // First try internal server endpoint (avoids CORS and sets valid User-Agent)
      const res = await fetch(`/api/v1/location/reverse?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        return {
          locality: data.locality || "Salt Lake, Sector V",
          city: data.city || "Kolkata",
          formatted_address: data.formatted_address,
        };
      }
    } catch {
      // ignore and fallback
    }

    // Intelligent coordinate cluster identification for India & global coordinates
    if (lat >= 22.4 && lat <= 22.8 && lng >= 88.2 && lng <= 88.6) {
      return { locality: "Salt Lake, Sector V", city: "Kolkata" };
    }
    if (lat >= 28.3 && lat <= 28.9 && lng >= 76.8 && lng <= 77.4) {
      return { locality: "Connaught Place / Gurgaon", city: "Delhi-NCR" };
    }
    if (lat >= 18.8 && lat <= 19.3 && lng >= 72.7 && lng <= 73.1) {
      return { locality: "Bandra / BKC", city: "Mumbai" };
    }
    if (lat >= 12.8 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8) {
      return { locality: "Indiranagar / Koramangala", city: "Bengaluru" };
    }

    return { locality: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`, city: "GPS Location" };
  },

  /**
   * Forward geocode spoken village/locality name to coordinates
   */
  async forwardGeocode(
    queryText: string
  ): Promise<{ latitude: number; longitude: number; display_name: string } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          queryText
        )}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          display_name: data[0].display_name,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};
