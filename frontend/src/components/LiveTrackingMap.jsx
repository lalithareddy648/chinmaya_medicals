import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default leaflet icons not loading in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons
const pharmacyIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4320/4320337.png', // Hospital/Pharmacy icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const homeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png', // Home icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const bikeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // Delivery Bike
  iconSize: [45, 45],
  iconAnchor: [22, 22],
});

const LiveTrackingMap = ({ status }) => {
  // Pharmacy Location (Static - e.g., a central point)
  const [pharmacyPos] = useState([17.3850, 78.4867]); // Example: Hyderabad coords
  // Customer Location (Simulated nearby point)
  const [customerPos] = useState([
    pharmacyPos[0] + (Math.random() * 0.05 - 0.025),
    pharmacyPos[1] + (Math.random() * 0.05 - 0.025)
  ]);
  
  const [currentPos, setCurrentPos] = useState(pharmacyPos);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === 'Delivered') {
      setCurrentPos(customerPos);
      setProgress(100);
      return;
    }
    
    if (status === 'Out For Delivery') {
      // Animate the bike from pharmacy to customer
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 1; // 1% every 200ms -> 20 seconds total trip for demo
        if (currentProgress > 100) currentProgress = 100;
        
        const newLat = pharmacyPos[0] + (customerPos[0] - pharmacyPos[0]) * (currentProgress / 100);
        const newLng = pharmacyPos[1] + (customerPos[1] - pharmacyPos[1]) * (currentProgress / 100);
        
        setCurrentPos([newLat, newLng]);
        setProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(interval);
        }
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setCurrentPos(pharmacyPos);
    }
  }, [status, customerPos, pharmacyPos]);

  // Center map slightly offset to fit both points
  const centerPos = [
    (pharmacyPos[0] + customerPos[0]) / 2,
    (pharmacyPos[1] + customerPos[1]) / 2
  ];

  return (
    <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-glass)', marginTop: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
        <span style={{ fontSize: '1.5rem' }}>🛰️</span> Live GPS Tracking
      </h3>
      
      {status === 'Out For Delivery' && (
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Driver is en route to your location. Estimated arrival in a few minutes.
        </div>
      )}
      
      <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border-glass)' }}>
        <MapContainer center={centerPos} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Marker position={pharmacyPos} icon={pharmacyIcon}>
            <Popup>Chinmaya Medicals</Popup>
          </Marker>
          
          <Marker position={customerPos} icon={homeIcon}>
            <Popup>Delivery Address</Popup>
          </Marker>
          
          {/* The Route Line */}
          <Polyline positions={[pharmacyPos, customerPos]} color="var(--color-primary)" dashArray="5, 10" weight={3} opacity={0.6} />
          
          {/* The Moving Bike */}
          {(status === 'Out For Delivery' || status === 'Delivered') && (
            <Marker position={currentPos} icon={bikeIcon} zIndexOffset={1000}>
              <Popup>{status === 'Delivered' ? 'Package Delivered!' : `Out for Delivery (${progress}%)`}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
