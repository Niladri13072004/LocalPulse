import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface WardInfo {
  wardName: string;
  city: string;
}

// Distance calculation using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Map coordinates to nearest demo ward
export function resolveWardAndCity(lat: number, lng: number): WardInfo {
  const cities = [
    { name: 'Indore', ward: 'Rajwada Ward', lat: 22.7196, lng: 75.8577 },
    { name: 'Patna', ward: 'Kankarbagh Ward', lat: 25.5940, lng: 85.1560 },
    { name: 'Jaipur', ward: 'Pink City Ward', lat: 26.9215, lng: 75.8242 },
    { name: 'Lucknow', ward: 'Hazratganj Ward', lat: 26.8510, lng: 80.9425 },
    { name: 'Nagpur', ward: 'Dharampeth Ward', lat: 21.1458, lng: 79.0882 },
    { name: 'Kolkata', ward: 'Salt Lake Ward', lat: 22.5726, lng: 88.3639 },
  ];

  let nearestCity = cities[0];
  let minDistance = Infinity;

  for (const city of cities) {
    const dist = getDistance(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = city;
    }
  }

  // If the nearest city is too far, default to Indore for testing purposes, but print nearest
  return {
    wardName: nearestCity.ward,
    city: nearestCity.name,
  };
}

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [wardInfo, setWardInfo] = useState<WardInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        // Provide Indore Rajwada mock location when permission is denied so app is functional
        const mockCoords = { latitude: 22.7196, longitude: 75.8577 };
        setLocation({
          coords: {
            latitude: mockCoords.latitude,
            longitude: mockCoords.longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as any);
        setWardInfo(resolveWardAndCity(mockCoords.latitude, mockCoords.longitude));
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc);
      setWardInfo(resolveWardAndCity(loc.coords.latitude, loc.coords.longitude));
    } catch (err) {
      setErrorMsg('Could not fetch location. Using mock Indore location.');
      const mockCoords = { latitude: 22.7196, longitude: 75.8577 };
      setWardInfo(resolveWardAndCity(mockCoords.latitude, mockCoords.longitude));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return { location, wardInfo, errorMsg, loading, refetchLocation: fetchLocation };
}
