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
import { useProfile } from '../contexts/ProfileContext';

type ProfileScreenProps = {
  onBack: () => void;
};

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { theme } = useTheme();
  const { profile, updateProfile, loading } = useProfile();
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ nickname: nickname.trim() });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { 
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border
      }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Display Name</Text>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          This name will be visible to other members in your circles
        </Text>

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary
          }]}
          placeholder="Enter your nickname"
          placeholderTextColor={theme.colors.textSecondary}
          value={nickname}
          onChangeText={setNickname}
          maxLength={30}
          autoFocus
          editable={!saving}
        />

        <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
          {nickname.length}/30 characters
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
          disabled={saving || !nickname.trim()}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>Save</Text>
          )}
        </TouchableOpacity>

        {profile?.nickname && (
          <View style={[styles.currentProfile, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }]}>
            <Text style={[styles.currentLabel, { color: theme.colors.textSecondary }]}>Current nickname:</Text>
            <Text style={[styles.currentNickname, { color: theme.colors.textPrimary }]}>{profile.nickname}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {},
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  currentProfile: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  currentLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  currentNickname: {
    fontSize: 20,
    fontWeight: '700',
  },
});
