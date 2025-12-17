import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useCircles } from './CircleContext';
import {
  startLocationTracking,
  stopLocationTracking,
  updateCircleIds,
  requestForegroundPermissions,
  getCurrentLocation,
  LocationData,
} from '../lib/locationService';

export type MemberLocation = {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  circleIds: string[]; // User may appear in multiple circles
  isLastKnown: boolean;
};

type LocationContextType = {
  memberLocations: Map<string, MemberLocation>; // keyed by userId
  isTracking: boolean;
  hasPermission: boolean;
  currentLocation: LocationData | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refreshCurrentLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { circles } = useCircles();
  const [memberLocations, setMemberLocations] = useState<Map<string, MemberLocation>>(new Map());
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  const acceptedCircleIds = circles.map((c) => c.id);

  // Request location permission
  const requestPermission = useCallback(async () => {
    const { granted } = await requestForegroundPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  // Get current location
  const refreshCurrentLocation = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    }
  }, []);

  // Start tracking user location and publishing
  const startTracking = useCallback(async () => {
    if (acceptedCircleIds.length === 0) {
      console.log('No circles to track');
      return;
    }

    const granted = await requestPermission();
    if (!granted) {
      console.error('Permission denied');
      return;
    }

    await startLocationTracking(acceptedCircleIds, {
      interval: 10000, // 10 seconds
      distanceInterval: 10, // 10 meters
    });

    setIsTracking(true);
    await refreshCurrentLocation();
  }, [acceptedCircleIds, requestPermission, refreshCurrentLocation]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    await stopLocationTracking();
    setIsTracking(false);
  }, []);

  // Subscribe to realtime location updates for all accepted circles
  useEffect(() => {
    if (acceptedCircleIds.length === 0) {
      // Clean up existing channel
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        setRealtimeChannel(null);
      }
      return;
    }

    console.log('Setting up realtime subscription for circles:', acceptedCircleIds);

    // Create a channel for location updates
    const channel = supabase
      .channel('locations-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
          filter: `circle_id=in.(${acceptedCircleIds.join(',')})`,
        },
        (payload) => {
          console.log('Location update received:', payload);
          
          const newLocation = payload.new as {
            user_id: string;
            circle_id: string;
            latitude: number;
            longitude: number;
            accuracy: number | null;
            recorded_at: string;
            is_last_known: boolean;
          };

          setMemberLocations((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(newLocation.user_id);

            if (existing) {
              // Update existing location, merge circle IDs
              const circleIds = existing.circleIds.includes(newLocation.circle_id)
                ? existing.circleIds
                : [...existing.circleIds, newLocation.circle_id];

              updated.set(newLocation.user_id, {
                userId: newLocation.user_id,
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                accuracy: newLocation.accuracy,
                timestamp: newLocation.recorded_at,
                circleIds,
                isLastKnown: newLocation.is_last_known,
              });
            } else {
              // New location
              updated.set(newLocation.user_id, {
                userId: newLocation.user_id,
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                accuracy: newLocation.accuracy,
                timestamp: newLocation.recorded_at,
                circleIds: [newLocation.circle_id],
                isLastKnown: newLocation.is_last_known,
              });
            }

            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    setRealtimeChannel(channel);

    // Load initial locations
    loadInitialLocations(acceptedCircleIds);

    // Cleanup
    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [acceptedCircleIds.join(',')]); // Only re-subscribe when circle IDs change

  // Load initial/latest locations for all members in accepted circles
  const loadInitialLocations = async (circleIds: string[]) => {
    try {
      // Get the latest location for each user in each circle
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .in('circle_id', circleIds)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error loading initial locations:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No initial locations found');
        return;
      }

      // Group by user_id and take the most recent for each
      const locationMap = new Map<string, MemberLocation>();

      data.forEach((loc: any) => {
        const existing = locationMap.get(loc.user_id);
        
        if (!existing || new Date(loc.recorded_at) > new Date(existing.timestamp)) {
          const circleIds = existing?.circleIds.includes(loc.circle_id)
            ? existing.circleIds
            : [...(existing?.circleIds || []), loc.circle_id];

          locationMap.set(loc.user_id, {
            userId: loc.user_id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            timestamp: loc.recorded_at,
            circleIds,
            isLastKnown: loc.is_last_known,
          });
        }
      });

      setMemberLocations(locationMap);
      console.log(`Loaded ${locationMap.size} member locations`);
    } catch (error) {
      console.error('Error in loadInitialLocations:', error);
    }
  };

  // Update location service when circles change
  useEffect(() => {
    if (isTracking) {
      updateCircleIds(acceptedCircleIds);
    }
  }, [acceptedCircleIds.join(','), isTracking]);

  return (
    <LocationContext.Provider
      value={{
        memberLocations,
        isTracking,
        hasPermission,
        currentLocation,
        startTracking,
        stopTracking,
        requestPermission,
        refreshCurrentLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
