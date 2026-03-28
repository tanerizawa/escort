import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '../stores/auth';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';
import api from '../lib/api';

// Client tabs
import { HomeScreen } from '../screens/client/HomeScreen';
import { ClientBookingsScreen } from '../screens/client/ClientBookingsScreen';

// Escort tabs
import { EscortDashboardScreen } from '../screens/escort/EscortDashboardScreen';
import { EscortRequestsScreen } from '../screens/escort/EscortRequestsScreen';

// Shared tabs
import { ChatListScreen } from '../screens/common/ChatListScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  ChatList: undefined;
  Profile: undefined;
  // Escort
  Dashboard: undefined;
  Requests: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'search', inactive: 'search-outline' },
  Dashboard: { active: 'grid', inactive: 'grid-outline' },
  Bookings: { active: 'calendar', inactive: 'calendar-outline' },
  Requests: { active: 'list', inactive: 'list-outline' },
  ChatList: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function MainTabNavigator() {
  const user = useAuthStore((s) => s.user);
  const isEscort = user?.role === 'ESCORT';
  const [unreadChats, setUnreadChats] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const lastTabPress = useRef<{ name: string; time: number }>({ name: '', time: 0 });

  useEffect(() => {
    let cancelled = false;
    const fetchCounts = async () => {
      try {
        const [chatRes, bookingRes] = await Promise.all([
          api.get('/chat/conversations').catch(() => ({ data: { data: [] } })),
          isEscort ? api.get('/bookings?status=PENDING&limit=50').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        ]);
        if (cancelled) return;
        const chats = Array.isArray(chatRes.data?.data) ? chatRes.data.data : [];
        setUnreadChats(chats.filter((c: any) => c.unreadCount > 0).length);
        if (isEscort) {
          const raw = bookingRes.data?.data;
          const reqs = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
          setPendingRequests(reqs.length);
        }
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isEscort]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.darkCard,
          borderTopColor: COLORS.darkBorder,
          borderTopWidth: 0.5,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
        tabBarIcon: ({ color, focused, size }) => {
          const icons = TAB_ICONS[route.name] || { active: 'help', inactive: 'help-outline' };
          const iconName = focused ? icons.active : icons.inactive;
          const badge = route.name === 'ChatList' ? unreadChats : route.name === 'Requests' ? pendingRequests : 0;
          return (
            <View style={focused ? styles.activeIconWrap : styles.iconWrap}>
              <Ionicons name={iconName} size={focused ? 22 : 21} color={color} />
              {badge > 0 && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </Animated.View>
              )}
            </View>
          );
        },
        tabBarHideOnKeyboard: true,
      })}
      screenListeners={({ route, navigation }) => ({
        tabPress: () => {
          Haptics.selectionAsync();
          const now = Date.now();
          const last = lastTabPress.current;
          if (last.name === route.name && now - last.time < 350) {
            // Double-tap: pop to top and trigger scroll-to-top
            const state = navigation.getState();
            const isFocused = state.routes[state.index]?.name === route.name;
            if (isFocused) {
              (navigation as any).emit({ type: 'tabPress', target: route.key, canPreventDefault: false });
            }
          }
          lastTabPress.current = { name: route.name, time: now };
        },
      })}
    >
      {isEscort ? (
        <>
          <Tab.Screen name="Dashboard" component={EscortDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
          <Tab.Screen name="Requests" component={EscortRequestsScreen} options={{ tabBarLabel: 'Request' }} />
          <Tab.Screen name="Bookings" component={ClientBookingsScreen} options={{ tabBarLabel: 'Booking' }} />
          <Tab.Screen name="ChatList" component={ChatListScreen} options={{ tabBarLabel: 'Chat' }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
        </>
      ) : (
        <>
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Cari' }} />
          <Tab.Screen name="Bookings" component={ClientBookingsScreen} options={{ tabBarLabel: 'Booking' }} />
          <Tab.Screen name="ChatList" component={ChatListScreen} options={{ tabBarLabel: 'Chat' }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
        </>
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    position: 'relative',
  },
  activeIconWrap: {
    backgroundColor: COLORS.gold + '12',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.darkCard,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
});
