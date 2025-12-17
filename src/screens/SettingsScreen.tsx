import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { lightTheme } from '../design/tokens';
import { useTheme } from '../contexts/ThemeContext';

type SettingsScreenProps = {
  onBack: () => void;
};

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { theme, themeMode, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                {themeMode === 'dark' ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>About</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Version</Text>
            <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>0.1.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>App Name</Text>
            <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>Family Tracker</Text>
          </View>
        </View>
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
    padding: lightTheme.spacing.small,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: lightTheme.spacing.xsmall,
  },
  backButtonText: {
    fontSize: lightTheme.typography.sizes.body,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
  headerTitle: {
    fontSize: lightTheme.typography.sizes.h3,
    fontWeight: String(lightTheme.typography.weights.bold) as any,
  },
  content: {
    padding: lightTheme.spacing.medium,
  },
  section: {
    borderRadius: lightTheme.radii.medium,
    borderWidth: 1,
    marginBottom: lightTheme.spacing.small,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: lightTheme.typography.sizes.body,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
    padding: lightTheme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: lightTheme.spacing.small,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: lightTheme.typography.sizes.body,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: lightTheme.typography.sizes.bodySmall,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: lightTheme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
  },
  infoLabel: {
    fontSize: lightTheme.typography.sizes.body,
  },
  infoValue: {
    fontSize: lightTheme.typography.sizes.body,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
});
