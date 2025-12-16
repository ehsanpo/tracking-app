import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { lightTheme } from '../design/tokens';
import { useCircles, CircleMember, CircleWithMembership } from '../contexts/CircleContext';

type CircleManagementScreenProps = {
  circle: CircleWithMembership;
  onBack: () => void;
};

export default function CircleManagementScreen({ circle, onBack }: CircleManagementScreenProps) {
  const { getPendingRequests, acceptMember, rejectMember, regenerateJoinCode } = useCircles();
  const [pendingRequests, setPendingRequests] = useState<CircleMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = circle.membership.role === 'admin';

  const loadPendingRequests = async () => {
    if (!isAdmin) {
      console.log('Not admin, skipping pending requests');
      return;
    }

    console.log('Loading pending requests for circle:', circle.id);
    try {
      const requests = await getPendingRequests(circle.id);
      console.log('Pending requests found:', requests);
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error loading pending requests:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingRequests();
    setRefreshing(false);
  };

  const handleAcceptMember = async (memberId: string) => {
    setLoading(true);
    try {
      await acceptMember(memberId);
      Alert.alert('Success', 'Member accepted');
      await loadPendingRequests();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept member');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMember = async (memberId: string) => {
    setLoading(true);
    try {
      await rejectMember(memberId);
      Alert.alert('Success', 'Member rejected');
      await loadPendingRequests();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject member');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    Alert.alert(
      'Regenerate Join Code',
      'This will invalidate the current join code. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const newCode = await regenerateJoinCode(circle.id);
              Alert.alert('Success', `New join code: ${newCode}`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to regenerate code');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const copyJoinCode = () => {
    // For web, we can use navigator.clipboard
    // For mobile, you'd use expo-clipboard
    Alert.alert('Join Code', circle.join_code);
  };

  useEffect(() => {
    loadPendingRequests();
  }, [circle.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{circle.name}</Text>
      </View>

      <View style={styles.content}>
        {/* Join Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join Code</Text>
          <View style={styles.joinCodeContainer}>
            <Text style={styles.joinCode}>{circle.join_code}</Text>
            <TouchableOpacity style={styles.iconButton} onPress={copyJoinCode}>
              <Text style={styles.iconButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleRegenerateCode}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Regenerate Code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pending Requests Section (Admin Only) */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Requests ({pendingRequests.length})
            </Text>
            {pendingRequests.length === 0 ? (
              <Text style={styles.emptyText}>No pending requests</Text>
            ) : (
              <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                renderItem={({ item }) => (
                  <View style={styles.requestCard}>
                    <Text style={styles.requestText}>User ID: {item.user_id.slice(0, 8)}...</Text>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.button, styles.successButton]}
                        onPress={() => handleAcceptMember(item.id)}
                        disabled={loading}
                      >
                        <Text style={styles.buttonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.dangerButton]}
                        onPress={() => handleRejectMember(item.id)}
                        disabled={loading}
                      >
                        <Text style={styles.buttonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.infoText}>Role: {circle.membership.role}</Text>
          <Text style={styles.infoText}>
            Joined: {new Date(circle.membership.joined_at || '').toLocaleDateString()}
          </Text>
        </View>
      </View>
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
  },
  backButton: {
    padding: lightTheme.spacing.xsmall,
    marginRight: lightTheme.spacing.xsmall,
  },
  backButtonText: {
    fontSize: lightTheme.typography.sizes.body,
    color: lightTheme.colors.primary,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
  headerTitle: {
    fontSize: lightTheme.typography.sizes.h3,
    fontWeight: String(lightTheme.typography.weights.bold) as any,
    color: lightTheme.colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: lightTheme.spacing.small,
  },
  section: {
    marginBottom: lightTheme.spacing.medium,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.sizes.subhead,
    fontWeight: String(lightTheme.typography.weights.bold) as any,
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.xsmall,
  },
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.small,
    borderRadius: lightTheme.radii.medium,
    marginBottom: lightTheme.spacing.xsmall,
  },
  joinCode: {
    flex: 1,
    fontSize: lightTheme.typography.sizes.h2,
    fontWeight: String(lightTheme.typography.weights.bold) as any,
    color: lightTheme.colors.primary,
    letterSpacing: 2,
  },
  iconButton: {
    padding: lightTheme.spacing.xsmall,
  },
  iconButtonText: {
    color: lightTheme.colors.primary,
    fontSize: lightTheme.typography.sizes.bodySmall,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
  button: {
    borderRadius: lightTheme.radii.medium,
    padding: lightTheme.spacing.xsmall,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  secondaryButtonText: {
    color: lightTheme.colors.textPrimary,
    fontSize: lightTheme.typography.sizes.bodySmall,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
  emptyText: {
    fontSize: lightTheme.typography.sizes.body,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
    padding: lightTheme.spacing.medium,
  },
  requestCard: {
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.small,
    borderRadius: lightTheme.radii.medium,
    marginBottom: lightTheme.spacing.xsmall,
  },
  requestText: {
    fontSize: lightTheme.typography.sizes.body,
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.xsmall,
  },
  requestActions: {
    flexDirection: 'row',
    gap: lightTheme.spacing.xsmall,
  },
  successButton: {
    flex: 1,
    backgroundColor: lightTheme.colors.success,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: lightTheme.colors.danger,
  },
  buttonText: {
    color: lightTheme.colors.surface,
    fontSize: lightTheme.typography.sizes.bodySmall,
    fontWeight: String(lightTheme.typography.weights.medium) as any,
  },
  infoText: {
    fontSize: lightTheme.typography.sizes.bodySmall,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing.px,
  },
});
