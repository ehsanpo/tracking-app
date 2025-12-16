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
import { lightTheme, pickCircleColor } from '../design/tokens';
import MapScreen from './MapScreen';
import OnboardingScreen from './OnboardingScreen';
import CircleManagementScreen from './CircleManagementScreen';

type Screen = 'circles' | 'map' | 'management' | 'onboarding';

export default function HomeScreen() {
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

  // Show map screen
  if (currentScreen === 'map') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToCircles} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Circles</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Map</Text>
          <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <MapScreen circles={circles} />
      </View>
    );
  }

  // Show circles list
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Circles</Text>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <View style={styles.content}>
          {pendingCircles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏳ Pending Approval</Text>
              {pendingCircles.map((item) => (
                <View key={item.id} style={[styles.circleCard, styles.pendingCard]}>
                  <View
                    style={[
                      styles.circleColorIndicator,
                      { backgroundColor: pickCircleColor(item.id), opacity: 0.5 },
                    ]}
                  />
                  <View style={styles.circleInfo}>
                    <Text style={styles.circleName}>{item.name}</Text>
                    <Text style={styles.pendingText}>Waiting for admin approval...</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {circles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Circles</Text>
              <FlatList
                data={circles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.circleCard}
                    onPress={() => handleCirclePress(item)}
                  >
                    <View
                      style={[
                        styles.circleColorIndicator,
                        { backgroundColor: pickCircleColor(item.id) },
                      ]}
                    />
                    <View style={styles.circleInfo}>
                      <Text style={styles.circleName}>{item.name}</Text>
                      <Text style={styles.circleRole}>
                        {item.membership.role === 'admin' ? '👑 Admin' : 'Member'}
                      </Text>
                    </View>
                    <Text style={styles.arrowText}>→</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
                scrollEnabled={false}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleViewMap}
          >
            <Text style={styles.primaryButtonText}>View Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setCurrentScreen('onboarding')}
          >
            <Text style={styles.secondaryButtonText}>+ Add Another Circle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  header: {
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: lightTheme.typography.sizes.h3,
    fontWeight: String(lightTheme.typography.weights.bold) as any,
    color: lightTheme.colors.textPrimary,
  },
  backButton: {
    padding: lightTheme.spacing.xsmall,
  },
  backButtonText: {
    fontSize: lightTheme.typography.sizes.body,
    color: lightTheme.colors.primary,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
  signOutButton: {
    padding: lightTheme.spacing.xsmall,
  },
  signOutText: {
    fontSize: lightTheme.typography.sizes.bodySmall,
    color: lightTheme.colors.danger,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: lightTheme.spacing.small,
  },
  listContent: {
    paddingBottom: lightTheme.spacing.small,
  },
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.small,
    borderRadius: lightTheme.radii.medium,
    marginBottom: lightTheme.spacing.xsmall,
  },
  circleColorIndicator: {
    width: 4,
    height: 48,
    borderRadius: lightTheme.radii.small,
    marginRight: lightTheme.spacing.small,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: lightTheme.typography.sizes.body,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.px,
  },
  circleRole: {
    fontSize: lightTheme.typography.sizes.bodySmall,
    color: lightTheme.colors.textSecondary,
  },
  arrowText: {
    fontSize: lightTheme.typography.sizes.h2,
    color: lightTheme.colors.textSecondary,
  },
  section: {
    marginBottom: lightTheme.spacing.medium,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.sizes.subhead,
    fontWeight: String(lightTheme.typography.weights.bold) as any,
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.xsmall,
    paddingHorizontal: lightTheme.spacing.px,
  },
  pendingCard: {
    opacity: 0.8,
    borderLeftWidth: 3,
    borderLeftColor: lightTheme.colors.warning,
  },
  pendingText: {
    fontSize: lightTheme.typography.sizes.bodySmall,
    color: lightTheme.colors.warning,
    fontStyle: 'italic',
  },
  button: {
    borderRadius: lightTheme.radii.medium,
    padding: lightTheme.spacing.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: lightTheme.spacing.xsmall,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: lightTheme.colors.primary,
  },
  primaryButtonText: {
    color: lightTheme.colors.surface,
    fontSize: lightTheme.typography.sizes.body,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  secondaryButtonText: {
    color: lightTheme.colors.textPrimary,
    fontSize: lightTheme.typography.sizes.body,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
});
