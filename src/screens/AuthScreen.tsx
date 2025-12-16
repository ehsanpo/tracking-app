import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { lightTheme, spacing } from '../design/tokens';

export default function AuthScreen() {
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert('Success', 'Account created! Please sign in.');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Family Tracker</Text>
      <Text style={styles.subtitle}>{isSignUp ? 'Create an account' : 'Sign in to continue'}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Button title={loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')} onPress={handleAuth} disabled={loading} />
      
      <Text style={styles.toggle} onPress={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: spacing.xsmall,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: spacing.medium,
    textAlign: 'center',
    color: lightTheme.colors.textSecondary,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    padding: spacing.small,
    marginBottom: spacing.small,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    borderRadius: 8,
    backgroundColor: lightTheme.colors.surface,
  },
  toggle: {
    marginTop: spacing.small,
    color: lightTheme.colors.primary,
    textDecorationLine: 'underline',
  },
});
