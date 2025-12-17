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
import { useTheme } from '../contexts/ThemeContext';
import { useCircles, CircleMember, CircleWithMembership } from '../contexts/CircleContext';

type CircleManagementScreenProps = {
  circle: CircleWithMembership;
  onBack: () => void;
};

export default function CircleManagementScreen({ circle, onBack }: CircleManagementScreenProps) {
  const { theme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { 
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border
      }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{circle.name}</Text>
      </View>

      <View style={styles.content}>
        {/* Join Code Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Join Code</Text>
          <View style={[styles.joinCodeContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.joinCode, { color: theme.colors.primary }]}>{circle.join_code}</Text>
            <TouchableOpacity style={styles.iconButton} onPress={copyJoinCode}>
              <Text style={[styles.iconButtonText, { color: theme.colors.primary }]}>Copy</Text>
            </TouchableOpacity>
          </View>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
              onPress={handleRegenerateCode}
              disabled={loading}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>Regenerate Code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pending Requests Section (Admin Only) */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Pending Requests ({pendingRequests.length})
            </Text>
            {pendingRequests.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No pending requests</Text>
            ) : (
              <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                renderItem={({ item }) => (
                  <View style={[styles.requestCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.requestText, { color: theme.colors.textPrimary }]}>User ID: {item.user_id.slice(0, 8)}...</Text>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.button, styles.successButton, { backgroundColor: theme.colors.success }]}
                        onPress={() => handleAcceptMember(item.id)}
                        disabled={loading}
                      >
                        <Text style={[styles.buttonText, { color: theme.colors.surface }]}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.dangerButton, { backgroundColor: theme.colors.danger }]}
                        onPress={() => handleRejectMember(item.id)}
                        disabled={loading}
                      >
                        <Text style={[styles.buttonText, { color: theme.colors.surface }]}>Reject</Text>
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
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>Role: {circle.membership.role}</Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
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
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
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
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  joinCode: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  iconButton: {
    padding: 8,
  },
  iconButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  requestCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  requestText: {
    fontSize: 16,
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  successButton: {
    flex: 1,
  },
  dangerButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
