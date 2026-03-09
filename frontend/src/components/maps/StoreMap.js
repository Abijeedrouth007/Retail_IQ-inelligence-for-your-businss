import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MapPin, Store } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const StoreMap = ({ 
  storeLocation = { lat: 40.7128, lng: -74.0060 }, // Default: NYC
  storeName = "RetailIQ Store"
}) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if API key is placeholder
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setError('Google Maps API key not configured');
      return;
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => setError('Failed to load Google Maps');
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: storeLocation,
        zoom: 15,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8c8c8c" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d2d" }] },
          { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1117" }] },
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
        ],
        disableDefaultUI: true,
        zoomControl: true
      });

      new window.google.maps.Marker({
        position: storeLocation,
        map: map,
        title: storeName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#7c3aed",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });

      setMapLoaded(true);
    };

    loadGoogleMaps();
  }, [storeLocation, storeName]);

  if (error) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-violet-400" />
            Store Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-zinc-800 rounded-lg flex flex-col items-center justify-center">
            <Store className="w-12 h-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400 text-center">
              {error === 'Google Maps API key not configured' 
                ? 'Map preview not available. Configure Google Maps API key to enable.'
                : error
              }
            </p>
            <div className="mt-4 text-sm text-zinc-500">
              <p>{storeName}</p>
              <p>Lat: {storeLocation.lat.toFixed(4)}, Lng: {storeLocation.lng.toFixed(4)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-violet-400" />
          Store Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="h-[300px] rounded-lg overflow-hidden"
          style={{ 
            background: mapLoaded ? 'transparent' : '#1d1d1d' 
          }}
        />
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="font-medium">{storeName}</p>
            <p className="text-sm text-zinc-500">
              {storeLocation.lat.toFixed(4)}, {storeLocation.lng.toFixed(4)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreMap;
