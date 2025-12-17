import React from 'react';
import { SafeAreaView, ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { CircleProvider } from './contexts/CircleContext';
import { LocationProvider } from './contexts/LocationContext';
import { ProfileProvider } from './contexts/ProfileContext';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';

function AppContent() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!user ? <AuthScreen /> : <HomeScreen />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProfileProvider>
          <CircleProvider>
            <LocationProvider>
              <AppContent />
            </LocationProvider>
          </CircleProvider>
        </ProfileProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
