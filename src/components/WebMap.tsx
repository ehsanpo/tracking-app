import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MemberLocation } from '../contexts/LocationContext';
import { pickCircleColor } from '../design/tokens';
import { useTheme } from '../contexts/ThemeContext';

// Fix for default marker icons in Leaflet
import 'leaflet/dist/leaflet.css';

// Fix default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type WebMapProps = {
  currentLocation: { latitude: number; longitude: number } | null;
  memberLocations: MemberLocation[];
  mapCenter: { latitude: number; longitude: number };
  onMemberClick?: (location: MemberLocation) => void;
};

// Component to update map center when it changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center[0], center[1]]);
  
  return null;
}

// Create custom colored markers for circles
function createColoredIcon(color: string) {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.3 12.5 28.5 12.5 28.5S25 20.8 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
        <circle cx="12.5" cy="12.5" r="6" fill="white"/>
      </svg>
    `)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

export default function WebMap({ currentLocation, memberLocations, mapCenter, onMemberClick }: WebMapProps) {
  const { themeMode } = useTheme();
  const [center, setCenter] = useState<[number, number]>([mapCenter.latitude, mapCenter.longitude]);

  useEffect(() => {
    setCenter([mapCenter.latitude, mapCenter.longitude]);
  }, [mapCenter.latitude, mapCenter.longitude]);

  // Use dark map tiles in dark mode
  const tileUrl = themeMode === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  
  const attribution = themeMode === 'dark'
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const handleMarkerClick = (location: MemberLocation) => {
    setCenter([location.latitude, location.longitude]);
    if (onMemberClick) {
      onMemberClick(location);
    }
  };

  return (
    <View style={styles.container}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={attribution}
          url={tileUrl}
        />
        
        <MapUpdater center={center} />
        
        {/* Current user marker */}
        {currentLocation && (
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={createColoredIcon('#2563EB')}
          >
          </Marker>
        )}
        
        {/* Other member markers */}
        {memberLocations.map((loc) => {
          const circleColor = pickCircleColor(loc.circleIds[0] || '');
          
          return (
            <Marker
              key={loc.userId}
              position={[loc.latitude, loc.longitude]}
              icon={createColoredIcon(circleColor)}
              eventHandlers={{
                click: () => handleMarkerClick(loc),
              }}
            >
            </Marker>
          );
        })}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
