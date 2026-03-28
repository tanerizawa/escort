import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { COLORS } from '../../constants/theme';
import { Notification } from '../../constants/types';
import api from '../../lib/api';
import dayjs from 'dayjs';

const TYPE_ICONS: Record<string, string> = {
  BOOKING: 'calendar',
  PAYMENT: 'card',
  CHAT: 'chatbubble',
  SAFETY: 'shield',
  SYSTEM: 'information-circle',
};

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data?.data || data.data || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch { /* ignore */ }
  };

  const handlePress = (notif: Notification) => {
    if (!notif.isRead) markRead(notif.id);
    if (notif.data?.bookingId) {
      navigation.navigate('BookingDetail', { bookingId: notif.data.bookingId });
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={COLORS.gold} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(TYPE_ICONS[item.type] || 'notifications') as any}
              size={20}
              color={item.isRead ? COLORS.textMuted : COLORS.gold}
            />
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]}>
                {item.title}
              </Text>
              <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.cardTime}>{dayjs(item.createdAt).format('DD MMM, HH:mm')}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Belum ada notifikasi</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  list: { paddingVertical: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  cardUnread: { backgroundColor: COLORS.gold + '08' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  cardTitleUnread: { fontWeight: '700' },
  cardBody: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  cardTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
});
