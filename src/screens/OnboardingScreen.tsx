import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { lightTheme } from '../design/tokens';
import { useCircles } from '../contexts/CircleContext';

type OnboardingScreenProps = {
  onComplete: () => void;
  onCancel?: () => void; // Optional cancel for when adding additional circles
};

export default function OnboardingScreen({ onComplete, onCancel }: OnboardingScreenProps) {
  const { createCircle, joinCircle } = useCircles();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [circleName, setCircleName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    setLoading(true);
    try {
      const circle = await createCircle(circleName.trim());
      console.log('Circle created successfully:', circle);
      setLoading(false);
      
      // Show alert with timeout to ensure it displays
      setTimeout(() => {
        Alert.alert(
          '✓ Circle Created!',
          `Your join code is: ${circle.join_code}\n\nShare this code with family members so they can join.`,
          [{ text: 'OK', onPress: onComplete }]
        );
      }, 100);
    } catch (err: any) {
      setLoading(false);
      console.error('Failed to create circle:', err);
      Alert.alert('Error', err.message || 'Failed to create circle');
    }
  };

  const handleJoinCircle = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to join circle with code:', joinCode);
      await joinCircle(joinCode.trim());
      console.log('Join request successful');
      setLoading(false);
      setJoinCode('');
      setMode('choose');
      
      // Show alert after state updates
      setTimeout(() => {
        Alert.alert(
          '✓ Request Sent',
          'Your membership request has been sent to the circle admin. You will be able to see the circle once the admin accepts your request.',
          [{ text: 'OK' }]
        );
      }, 100);
    } catch (err: any) {
      setLoading(false);
      console.error('Join failed:', err);
      Alert.alert('Error', err.message || 'Failed to join circle');
    }
  };

  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>← Cancel</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.title}>
            {onCancel ? 'Add Another Circle' : 'Welcome!'}
          </Text>
          <Text style={styles.subtitle}>
            Create a new circle or join an existing one to start tracking your family.
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => setMode('create')}
          >
            <Text style={styles.primaryButtonText}>Create a Circle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setMode('join')}
          >
            <Text style={styles.secondaryButtonText}>Join a Circle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'create') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Create a Circle</Text>
          <Text style={styles.subtitle}>Give your family circle a name</Text>

          <TextInput
            style={styles.input}
            placeholder="Circle Name (e.g., Smith Family)"
            placeholderTextColor={lightTheme.colors.textSecondary}
            value={circleName}
            onChangeText={setCircleName}
            autoFocus
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCreateCircle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={lightTheme.colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>Create Circle</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setMode('choose')}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // mode === 'join'
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Join a Circle</Text>
        <Text style={styles.subtitle}>Enter the join code from your family admin</Text>

        <TextInput
          style={styles.input}
          placeholder="Join Code (e.g., ABC123)"
          placeholderTextColor={lightTheme.colors.textSecondary}
          value={joinCode}
          onChangeText={(text) => setJoinCode(text.toUpperCase())}
          autoCapitalize="characters"
          autoFocus
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleJoinCircle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={lightTheme.colors.surface} />
          ) : (
            <Text style={styles.primaryButtonText}>Join Circle</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setMode('choose')}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: lightTheme.spacing.medium,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: lightTheme.typography.sizes.h1,
    fontWeight: String(lightTheme.typography.weights.bold) as any,
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.xsmall,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: lightTheme.typography.sizes.body,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing.large,
    textAlign: 'center',
  },
  input: {
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    borderRadius: lightTheme.radii.medium,
    padding: lightTheme.spacing.small,
    fontSize: lightTheme.typography.sizes.body,
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.small,
  },
  button: {
    borderRadius: lightTheme.radii.medium,
    padding: lightTheme.spacing.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: lightTheme.spacing.small,
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
  cancelButton: {
    alignSelf: 'flex-start',
    padding: lightTheme.spacing.xsmall,
    marginBottom: lightTheme.spacing.small,
  },
  cancelButtonText: {
    fontSize: lightTheme.typography.sizes.body,
    color: lightTheme.colors.primary,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
});
