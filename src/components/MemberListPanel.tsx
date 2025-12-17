import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MemberLocation } from '../contexts/LocationContext';
import { pickCircleColor } from '../design/tokens';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useTheme } from '../contexts/ThemeContext';

type MemberListPanelProps = {
  memberLocations: MemberLocation[];
  onMemberPress?: (location: MemberLocation) => void;
};

export default function MemberListPanel({ memberLocations, onMemberPress }: MemberListPanelProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { getProfileById } = useProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [nicknames, setNicknames] = useState<Map<string, string>>(new Map());

  // Filter out current user
  const otherMembers = memberLocations.filter((loc) => loc.userId !== user?.id);

  // Fetch nicknames for all members
  useEffect(() => {
    const fetchNicknames = async () => {
      const newNicknames = new Map<string, string>();
      for (const member of otherMembers) {
        const profile = await getProfileById(member.userId);
        if (profile?.nickname) {
          newNicknames.set(member.userId, profile.nickname);
        }
      }
      setNicknames(newNicknames);
    };

    if (otherMembers.length > 0) {
      fetchNicknames();
    }
  }, [otherMembers.length]);

  // Get display name for a user (nickname or shortened ID)
  const getDisplayName = (userId: string): string => {
    return nicknames.get(userId) || `${userId.substring(0, 8)}...`;
  };

  // Calculate time since last update
  const getTimeSince = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Determine if member is online (last update within 5 minutes)
  const isOnline = (timestamp: string): boolean => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    return diffMs < 5 * 60 * 1000; // 5 minutes
  };

  if (collapsed) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.collapsed, {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border
        }]}
        onPress={() => setCollapsed(false)}
      >
        <Text style={[styles.collapsedText, { color: theme.colors.textPrimary }]}>
          👥 {otherMembers.length} member{otherMembers.length !== 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border
    }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Family Members ({otherMembers.length})
        </Text>
        <TouchableOpacity onPress={() => setCollapsed(true)}>
          <Text style={[styles.collapseButton, { color: theme.colors.textSecondary }]}>−</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {otherMembers.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No other members visible</Text>
        ) : (
          otherMembers.map((member) => {
            const online = !member.isLastKnown && isOnline(member.timestamp);
            const circleColor = pickCircleColor(member.circleIds[0] || '');

            return (
              <TouchableOpacity 
                key={member.userId} 
                style={[styles.memberItem, { borderBottomColor: theme.colors.border }]}
                onPress={() => onMemberPress?.(member)}
                activeOpacity={0.7}
              >
                <View style={styles.memberInfo}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: circleColor },
                    ]}
                  />
                  <View style={styles.memberDetails}>
                    <Text style={[styles.memberName, { color: theme.colors.textPrimary }]}>
                      {getDisplayName(member.userId)}
                    </Text>
                    <Text style={[styles.memberStatus, { color: theme.colors.textSecondary }]}>
                      {member.isLastKnown ? '📍 Last known' : online ? '🟢 Online' : '⚪ Offline'} •{' '}
                      {getTimeSince(member.timestamp)}
                    </Text>
                    {member.accuracy && (
                      <Text style={[styles.accuracy, { color: theme.colors.textSecondary }]}>
                        ±{Math.round(member.accuracy)}m accuracy
                      </Text>
                    )}
                  </View>
                </View>
                {member.circleIds.length > 1 && (
                  <View style={[styles.circlesBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.circlesBadgeText, { color: theme.colors.surface }]}>
                      {member.circleIds.length} circles
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    maxHeight: 240,
  },
  collapsed: {
    padding: 16,
    maxHeight: 'auto' as any,
  },
  collapsedText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  collapseButton: {
    fontSize: 24,
    paddingHorizontal: 8,
  },
  list: {
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 14,
  },
  accuracy: {
    fontSize: 12,
    marginTop: 2,
  },
  circlesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  circlesBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
