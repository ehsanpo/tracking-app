import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export type UserProfile = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
};

type ProfileContextType = {
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  getProfileById: (userId: string) => Promise<UserProfile | null>;
  profilesCache: Map<string, UserProfile>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilesCache, setProfilesCache] = useState<Map<string, UserProfile>>(new Map());

  // Fetch current user's profile
  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (!data) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, nickname: null })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      // First, try to update
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        // If profile doesn't exist (PGRST116), create it with the updates
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, ...updates })
            .select()
            .single();

          if (insertError) throw insertError;
          setProfile(newData);
          return;
        }
        throw error;
      }
      
      setProfile(data);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  // Get profile by ID (with caching)
  const getProfileById = async (userId: string): Promise<UserProfile | null> => {
    // Check cache first
    if (profilesCache.has(userId)) {
      return profilesCache.get(userId)!;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      // Update cache
      setProfilesCache((prev) => new Map(prev).set(userId, data));
      return data;
    } catch (error) {
      console.error('Error in getProfileById:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        updateProfile,
        getProfileById,
        profilesCache,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}
