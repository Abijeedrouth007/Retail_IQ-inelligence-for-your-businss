import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Sample store locations (replace with API data)
const SAMPLE_STORES = [
  { id: 1, name: 'RetailIQ Store - Mumbai', lat: 19.0760, lng: 72.8777 },
  { id: 2, name: 'RetailIQ Store - Delhi', lat: 28.6139, lng: 77.2090 },
  { id: 3, name: 'RetailIQ Store - Bangalore', lat: 12.9716, lng: 77.5946 },
  { id: 4, name: 'RetailIQ Store - Chennai', lat: 13.0827, lng: 80.2707 },
  { id: 5, name: 'RetailIQ Store - Kolkata', lat: 22.5726, lng: 88.3639 },
];

// Component to recenter map
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 12);
  }, [center, map]);
  return null;
}

const StoreMap = ({ stores = SAMPLE_STORES, height = '400px' }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const defaultCenter = [20.5937, 78.9629]; // India center

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setLoading(false);
        },
        () => setLoading(false),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLoading(false);
    }
  }, []);

  const center = userLocation || defaultCenter;

  if (loading) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', borderRadius: '12px' }}>
        <span style={{ color: '#888' }}>Loading map...</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={userLocation ? 12 : 5}
      style={{ height, width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      
      {/* User location marker */}
      {userLocation && (
        <Marker position={userLocation}>
          <Popup>Your Location</Popup>
        </Marker>
      )}
      
      {/* Store markers */}
      {stores.map((store) => (
        <Marker key={store.id} position={[store.lat, store.lng]}>
          <Popup>{store.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default StoreMap;
