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
import { useTheme } from '../contexts/ThemeContext';
import { useCircles } from '../contexts/CircleContext';

type OnboardingScreenProps = {
  onComplete: () => void;
  onCancel?: () => void; // Optional cancel for when adding additional circles
};

export default function OnboardingScreen({ onComplete, onCancel }: OnboardingScreenProps) {
  const { createCircle, joinCircle } = useCircles();
  const { theme } = useTheme();
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={[styles.cancelButtonText, { color: theme.colors.primary }]}>← Cancel</Text>
            </TouchableOpacity>
          )}
          
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {onCancel ? 'Add Another Circle' : 'Welcome!'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Create a new circle or join an existing one to start tracking your family.
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>Create a Circle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={() => setMode('join')}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>Join a Circle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'create') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Create a Circle</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Give your family circle a name</Text>

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary
            }]}
            placeholder="Circle Name (e.g., Smith Family)"
            placeholderTextColor={theme.colors.textSecondary}
            value={circleName}
            onChangeText={setCircleName}
            autoFocus
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateCircle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>Create Circle</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Join a Circle</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Enter the join code from your family admin</Text>

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary
          }]}
          placeholder="Join Code (e.g., ABC123)"
          placeholderTextColor={theme.colors.textSecondary}
          value={joinCode}
          onChangeText={(text) => setJoinCode(text.toUpperCase())}
          autoCapitalize="characters"
          autoFocus
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleJoinCircle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>Join Circle</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={() => setMode('choose')}
          disabled={loading}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  cancelButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
