import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCircles, CircleWithMembership } from '../contexts/CircleContext';
import { useTheme } from '../contexts/ThemeContext';
import { pickCircleColor } from '../design/tokens';
import MapScreen from './MapScreen';
import OnboardingScreen from './OnboardingScreen';
import CircleManagementScreen from './CircleManagementScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';

type Screen = 'circles' | 'map' | 'management' | 'onboarding' | 'profile' | 'settings';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const { circles, pendingCircles, loading } = useCircles();
  const [currentScreen, setCurrentScreen] = useState<Screen>('circles');
  const [selectedCircle, setSelectedCircle] = useState<CircleWithMembership | null>(null);

  const handleCirclePress = (circle: CircleWithMembership) => {
    setSelectedCircle(circle);
    setCurrentScreen('management');
  };

  const handleViewMap = () => {
    setCurrentScreen('map');
  };

  const handleBackToCircles = () => {
    setCurrentScreen('circles');
    setSelectedCircle(null);
  };

  const handleOnboardingComplete = () => {
    // After onboarding, circles will refresh automatically
    setCurrentScreen('circles');
  };

  // Show onboarding if no circles or user wants to add another
  if (currentScreen === 'onboarding' || (!loading && circles.length === 0)) {
    return (
      <OnboardingScreen
        onComplete={handleOnboardingComplete}
        onCancel={circles.length > 0 ? handleBackToCircles : undefined}
      />
    );
  }

  // Show management screen
  if (currentScreen === 'management' && selectedCircle) {
    return <CircleManagementScreen circle={selectedCircle} onBack={handleBackToCircles} />;
  }

  // Show profile screen
  if (currentScreen === 'profile') {
    return <ProfileScreen onBack={handleBackToCircles} />;
  }

  // Show settings screen
  if (currentScreen === 'settings') {
    return <SettingsScreen onBack={handleBackToCircles} />;
  }

  // Show map screen
  if (currentScreen === 'map') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { 
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border
        }]}>
          <TouchableOpacity onPress={handleBackToCircles} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Circles</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Map</Text>
          <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
            <Text style={[styles.signOutText, { color: theme.colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <MapScreen circles={circles} />
      </View>
    );
  }

  // Show circles list
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { 
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border
      }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>My Circles</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setCurrentScreen('profile')} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('settings')} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
            <Text style={[styles.signOutText, { color: theme.colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {pendingCircles.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>⏳ Pending Approval</Text>
              {pendingCircles.map((item) => (
                <View key={item.id} style={[styles.circleCard, styles.pendingCard, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }]}>
                  <View
                    style={[
                      styles.circleColorIndicator,
                      { backgroundColor: pickCircleColor(item.id), opacity: 0.5 },
                    ]}
                  />
                  <View style={styles.circleInfo}>
                    <Text style={[styles.circleName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.pendingText, { color: theme.colors.textSecondary }]}>Waiting for admin approval...</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {circles.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>My Circles</Text>
              <FlatList
                data={circles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.circleCard, { 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border
                    }]}
                    onPress={() => handleCirclePress(item)}
                  >
                    <View
                      style={[
                        styles.circleColorIndicator,
                        { backgroundColor: pickCircleColor(item.id) },
                      ]}
                    />
                    <View style={styles.circleInfo}>
                      <Text style={[styles.circleName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.circleRole, { color: theme.colors.textSecondary }]}>
                        {item.membership.role === 'admin' ? '👑 Admin' : 'Member'}
                      </Text>
                    </View>
                    <Text style={[styles.arrowText, { color: theme.colors.textSecondary }]}>→</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
                scrollEnabled={false}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleViewMap}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>View Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={() => setCurrentScreen('onboarding')}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>+ Add Another Circle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconButtonText: {
    fontSize: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  circleColorIndicator: {
    width: 4,
    height: 48,
    borderRadius: 4,
    marginRight: 16,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  circleRole: {
    fontSize: 14,
  },
  arrowText: {
    fontSize: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  pendingCard: {
    opacity: 0.8,
    borderLeftWidth: 3,
  },
  pendingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 48,
  },
  primaryButton: {},
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
