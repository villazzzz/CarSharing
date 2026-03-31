import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PINATAR_COORDS = [41.7303, 2.5028]; // Approx Finca el Pinatar, Gualba

const eventIcon = L.divIcon({
  html: `<div style="background-color: #D95F02; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #1A1A1A; box-shadow: 0 0 10px rgba(217,95,2,0.8);"></div>`,
  className: 'custom-leaflet-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const originIcon = L.divIcon({
  html: `<div style="background-color: #10B981; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #1A1A1A; box-shadow: 0 0 6px rgba(16,185,129,0.8);"></div>`,
  className: 'custom-leaflet-icon',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapController({ selectedRide, originCoords }) {
  const map = useMap();

  useEffect(() => {
    if (selectedRide && originCoords) {
      const bounds = L.latLngBounds([PINATAR_COORDS, originCoords]);
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
    } else {
      map.flyTo(PINATAR_COORDS, 10, { duration: 1.5 });
    }
  }, [selectedRide, originCoords, map]);

  return null;
}

function MapFixer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export function InteractiveMap({ selectedRide }) {
  const [originCoords, setOriginCoords] = useState(null);

  useEffect(() => {
    if (!selectedRide) {
      setOriginCoords(null);
      return;
    }

    const geocode = async () => {
      try {
        const query = encodeURIComponent(selectedRide.origin + ', Barcelona, Spain');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          setOriginCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setOriginCoords([41.3874, 2.1686]); 
        }
      } catch (err) {
        setOriginCoords([41.3874, 2.1686]);
      }
    };

    geocode();
  }, [selectedRide]);

  const polylinePositions = originCoords ? [originCoords, PINATAR_COORDS] : [];

  return (
    <div className="absolute inset-0 z-0 bg-airport-board rounded-lg overflow-hidden group">
      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 rounded-lg z-[400]" />
      <MapContainer 
        center={PINATAR_COORDS} 
        zoom={9} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 10 }}
        zoomControl={true}
      >
        <MapFixer />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={PINATAR_COORDS} icon={eventIcon}>
          <Popup className="text-black">
            <strong className="text-black">Masia El Pinatar</strong><br/>
            Destinació de l'Equador
          </Popup>
        </Marker>

        {originCoords && (
          <>
            <Marker position={originCoords} icon={originIcon}>
              <Popup className="text-black">
                <strong className="text-black">{selectedRide.origin}</strong><br/>
                Origen de {selectedRide.driver_name}
              </Popup>
            </Marker>
            <Polyline 
              positions={polylinePositions} 
              pathOptions={{ 
                color: '#D95F02', 
                weight: 3, 
                opacity: 0.8, 
                dashArray: '10, 10',
                className: 'route-path-animated' 
              }} 
            />
          </>
        )}

        <MapController selectedRide={selectedRide} originCoords={originCoords} />
      </MapContainer>
    </div>
  );
}
