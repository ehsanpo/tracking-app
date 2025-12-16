import React from 'react';
import { SafeAreaView, ActivityIndicator, View, StyleSheet } from 'react-native';
import { lightTheme } from './design/tokens';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CircleProvider } from './contexts/CircleContext';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: lightTheme.colors.background }]}>
      {!user ? <AuthScreen /> : <HomeScreen />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CircleProvider>
        <AppContent />
      </CircleProvider>
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
