import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircleWithMembership } from '../contexts/CircleContext';
import { lightTheme } from '../design/tokens';

type MapScreenProps = {
  circles: CircleWithMembership[];
};

export default function MapScreen({ circles }: MapScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.text}>Map placeholder</Text>
        <Text style={styles.hint}>
          Showing {circles.length} circle{circles.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.hint}>We'll integrate `react-native-maps` and realtime updates next.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: lightTheme.spacing.small,
  },
  placeholder: {
    flex: 1,
    borderRadius: lightTheme.radii.large,
    backgroundColor: lightTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: lightTheme.typography.sizes.subhead,
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.xsmall,
  },
  hint: {
    fontSize: lightTheme.typography.sizes.bodySmall,
    color: lightTheme.colors.textSecondary,
    marginTop: lightTheme.spacing.px,
  },
});
