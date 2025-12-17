import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import { CircleWithMembership } from '../contexts/CircleContext';
import { useLocation } from '../contexts/LocationContext';
import { useTheme } from '../contexts/ThemeContext';
import MemberListPanel from '../components/MemberListPanel';

// Platform-specific map components
const MapComponent = Platform.OS === 'web' 
  ? require('../components/WebMap').default 
  : require('../components/NativeMap').default;

type MapScreenProps = {
  circles: CircleWithMembership[];
};

export default function MapScreen({ circles }: MapScreenProps) {
  const { theme } = useTheme();
  const {
    memberLocations,
    isTracking,
    isOnline,
    hasPermission,
    hasBackgroundPermission,
    currentLocation,
    setOnline,
    requestPermission,
    requestBackgroundPermission,
  } = useLocation();

  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number }>({
    latitude: 37.78825, // Default to San Francisco
    longitude: -122.4324,
  });

  // Update map center when current location is available
  useEffect(() => {
    if (currentLocation) {
      setMapCenter({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation]);

  // Request permissions on mount if not already granted
  useEffect(() => {
    const requestPermissionsIfNeeded = async () => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Location Permission Required',
            'This app needs access to your location to show your position to family members.'
          );
        }
      }
      
      // Request background permission for better tracking (Android only)
      if (hasPermission && !hasBackgroundPermission && Platform.OS === 'android') {
        await requestBackgroundPermission();
      }
    };
    
    requestPermissionsIfNeeded();
  }, []);

  const handleToggleOnline = async () => {
    await setOnline(!isOnline);
  };

  // Convert Map to array for rendering
  const memberLocationArray = Array.from(memberLocations.values());

  // Filter out current user's location from member locations
  const otherMemberLocations = memberLocationArray.filter(
    (loc) => !currentLocation || loc.userId !== 'current-user' // We'll need user ID from auth context
  );

  if (circles.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.placeholder}>
          <Text style={[styles.text, { color: theme.colors.textPrimary }]}>No Circles</Text>
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>Join or create a circle to start tracking</Text>
        </View>
      </View>
    );
  }

  const handleMemberClick = (location: any) => {
    console.log('Member clicked:', location);
    // Update map center to the clicked member
    setMapCenter({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  return (
    <View style={styles.container}>
      {/* Map Component */}
      <View style={styles.mapContainer}>
        <MapComponent
          currentLocation={currentLocation}
          memberLocations={otherMemberLocations}
          mapCenter={mapCenter}
          onMemberClick={handleMemberClick}
        />
      </View>

      {/* Member List Panel */}
      <MemberListPanel 
        memberLocations={memberLocationArray}
        onMemberPress={handleMemberClick}
      />

      {/* Control Panel */}
      <View style={[styles.controlPanel, { 
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border
      }]}>
        <View style={styles.statusRow}>
          <View>
            <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>
              {isOnline ? '🟢 Online' : '⚪ Offline'}
            </Text>
            {isTracking && (
              <Text style={[styles.statusSubtext, { color: theme.colors.textSecondary }]}>
                {hasBackgroundPermission ? 'Background tracking enabled' : 'Foreground tracking only'}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !isOnline ? styles.offlineButton : styles.onlineButton, {
            backgroundColor: !isOnline ? theme.colors.warning : theme.colors.success
          }]}
          onPress={handleToggleOnline}
        >
          <Text style={[styles.buttonText, { color: theme.colors.surface }]}>
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>

        {!hasPermission && (
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
            Location permission needed to share your position
          </Text>
        )}
        
        {isOnline && !isTracking && hasPermission && (
          <Text style={[styles.hint, { color: theme.colors.warning }]}>
            Waiting to start tracking...
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  controlPanel: {
    padding: 16,
    borderTopWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  onlineButton: {},
  offlineButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
