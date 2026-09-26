/**
 * Location Service: Device GPS, Reverse Geocoding, Distance calculation
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  locality?: string;
  city?: string;
  accuracy?: number;
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
  // Capture device GPS
  async getCurrentPosition(): Promise<GeoLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          try {
            const geocoded = await locationService.reverseGeocode(lat, lng);
            resolve({
              latitude: lat,
              longitude: lng,
              locality: geocoded.locality,
              city: geocoded.city,
              accuracy,
            });
          } catch {
            resolve({
              latitude: lat,
              longitude: lng,
              locality: "Detected Location",
              city: "Current GPS",
              accuracy,
            });
          }
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  },

  // Reverse geocode lat/lng to human-readable address
  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{ locality: string; city: string }> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) throw new Error("Reverse geocoding failed");
      const data = await res.json();
      const addr = data.address || {};
      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.road ||
        "Salt Lake, Sector V";
      const city = addr.city || addr.town || addr.state_district || "Kolkata";
      return { locality, city };
    } catch {
      return { locality: "Salt Lake, Sector V", city: "Kolkata" };
    }
  },

  // Forward geocode spoken village/locality name to coordinates
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
