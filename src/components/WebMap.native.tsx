import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// This is a stub for WebMap on native platforms
// The actual WebMap with Leaflet is only used on web
export default function WebMap() {
  return (
    <View style={styles.container}>
      <Text>Web map not available on native platforms</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
