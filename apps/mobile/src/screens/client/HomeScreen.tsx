import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  RefreshControl, Pressable, Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { MasonryFlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { EscortCard } from '../../components/EscortCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { StoryRing } from '../../components/ui/StoryRing';
import { TypewriterText } from '../../components/ui/TypewriterText';
import { BrandRefreshIndicator } from '../../components/ui/BrandRefreshIndicator';
import { SwipeCard } from '../../components/ui/SwipeCard';
import { COLORS, SPACING, RADIUS, SHADOWS, GRADIENTS, TIER_COLORS, getGreeting, HIT_SLOP, resolvePhotoUrl } from '../../constants/theme';
import { EscortListItem, EscortTier } from '../../constants/types';
import { useAuthStore } from '../../stores/auth';
import { useHaptic } from '../../hooks/useHaptic';
import api from '../../lib/api';

const TIERS: (EscortTier | 'ALL')[] = ['ALL', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
const { width: SCREEN_W } = Dimensions.get('window');

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const [escorts, setEscorts] = useState<EscortListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<EscortTier | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [greetingKey, setGreetingKey] = useState(0);
  const { selection } = useHaptic();

  const fetchEscorts = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      const params: any = { page: pageNum, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (selectedTier !== 'ALL') params.tier = selectedTier;
      const { data } = await api.get('/escorts', { params });
      const items = data.data?.data || data.data || [];
      const pagination = data.data?.pagination;
      if (refresh || pageNum === 1) setEscorts(items);
      else setEscorts((prev) => [...prev, ...items]);
      setHasMore(pagination ? pageNum < pagination.totalPages : items.length === 10);
      setPage(pageNum);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedTier]);

  useEffect(() => { setLoading(true); fetchEscorts(1, true); }, [selectedTier, fetchEscorts]);

  const handleSearch = () => { setLoading(true); fetchEscorts(1, true); };
  const handleRefresh = () => { setRefreshing(true); setGreetingKey((k) => k + 1); fetchEscorts(1, true); };
  const handleLoadMore = () => { if (!loading && hasMore) fetchEscorts(page + 1); };

  const renderHeader = () => {
    const featured = escorts.length > 0 ? escorts[0] : null;
    const onlineEscorts = escorts.filter((_, i) => i < 8);
    const featuredPhoto = resolvePhotoUrl(featured?.user?.profilePhoto);

    return (
      <>
        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.greeting}>
          <View>
            <TypewriterText key={greetingKey} text={`${getGreeting()}, ${user?.firstName} ✨`} speed={35} style={styles.greetText} />
            <Text style={styles.greetSub}>Temukan companion sempurna Anda</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={HIT_SLOP}
            style={styles.notifBtn}
            accessibilityRole="button"
            accessibilityLabel="Notifikasi"
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.gold} />
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama, keahlian..."
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              accessibilityLabel="Cari escort"
              accessibilityHint="Ketik nama atau keahlian untuk mencari"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); handleSearch(); }}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Story Rings — Available Now */}
        {onlineEscorts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Text style={styles.sectionLabel}>Available Now</Text>
            <FlatList
              data={onlineEscorts}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storyRow}
              keyExtractor={(e) => `story-${e.id}`}
              renderItem={({ item }) => {
                const uri = resolvePhotoUrl(item.user.profilePhoto);
                return (
                  <TouchableOpacity
                    style={styles.storyItem}
                    onPress={() => navigation.navigate('EscortDetail', { escortId: item.id })}
                    activeOpacity={0.8}
                  >
                    <StoryRing
                      uri={uri}
                      size={62}
                      ringColors={GRADIENTS.gold}
                    />
                    <Text style={styles.storyName} numberOfLines={1}>{item.user.firstName}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        )}

        {/* Featured Hero — Swipeable */}
        {featured && (
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Text style={styles.sectionLabel}>Featured</Text>
            <SwipeCard
              onSwipeRight={() => navigation.navigate('EscortDetail', { escortId: featured.id })}
            >
            <Pressable
              style={styles.featuredCard}
              onPress={() => navigation.navigate('EscortDetail', { escortId: featured.id })}
            >
              {featuredPhoto ? (
                <Image source={{ uri: featuredPhoto }} style={styles.featuredImg} contentFit="cover" transition={400} placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }} />
              ) : (
                <View style={[styles.featuredImg, { backgroundColor: COLORS.darkCard, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="person" size={60} color={COLORS.textMuted} />
                </View>
              )}
              <LinearGradient colors={['transparent', 'rgba(11,17,32,0.92)']} style={styles.featuredGrad} />
              <View style={styles.featuredBadge}>
                <Text style={[styles.featuredBadgeText, { color: TIER_COLORS[featured.tier] || COLORS.gold }]}>
                  {featured.tier}
                </Text>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredName}>{featured.user.firstName} {featured.user.lastName}</Text>
                <View style={styles.featuredMeta}>
                  <Ionicons name="star" size={14} color={COLORS.gold} />
                  <Text style={styles.featuredRating}>{featured.ratingAvg.toFixed(1)}</Text>
                  <Text style={styles.featuredDot}>·</Text>
                  <Text style={styles.featuredBookings}>{featured.totalBookings.toLocaleString('id-ID')} booking</Text>
                  <Text style={styles.featuredDot}>·</Text>
                  <Text style={styles.featuredRate}>Rp {featured.hourlyRate.toLocaleString('id-ID')}/jam</Text>
                </View>
              </View>
            </Pressable>
            </SwipeCard>
          </Animated.View>
        )}

        {/* Tier Filter */}
        <Animated.View entering={FadeInRight.delay(350).duration(400)}>
          <FlatList
            data={TIERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            keyExtractor={(t) => t}
            renderItem={({ item: t }) => (
              <Pressable
                style={[styles.filterChip, selectedTier === t && styles.filterChipActive]}
                onPress={() => { setSelectedTier(t); selection(); }}
              >
                {t !== 'ALL' && <View style={[styles.filterDot, { backgroundColor: TIER_COLORS[t] || COLORS.textMuted }]} />}
                <Text style={[styles.filterText, selectedTier === t && styles.filterTextActive]}>
                  {t === 'ALL' ? 'Semua' : t}
                </Text>
              </Pressable>
            )}
          />
        </Animated.View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <MasonryFlashList
        data={escorts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        estimatedItemSize={260}
        contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl }}
        ListHeaderComponent={() => (
          <>
            {refreshing && <BrandRefreshIndicator />}
            {renderHeader()}
          </>
        )}
        renderItem={({ item, index }) => (
          <View style={styles.masonryCard}>
            <EscortCard
              escort={item}
              onPress={() => navigation.navigate('EscortDetail', { escortId: item.id })}
              index={index}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <View style={styles.gridRow}>
              <SkeletonCard style={styles.card} />
              <SkeletonCard style={styles.card} />
            </View>
          ) : (
            <EmptyState
              icon="people-outline"
              title="Tidak ada escort ditemukan"
              subtitle="Coba ubah filter atau kata kunci pencarian"
            />
          )
        }
        ListFooterComponent={
          loading && escorts.length > 0 ? (
            <View style={[styles.gridRow, { paddingVertical: SPACING.lg }]}>
              <SkeletonCard style={styles.card} />
              <SkeletonCard style={styles.card} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: 56,
    paddingBottom: SPACING.md,
  },
  greetText: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  greetSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  searchRow: { paddingHorizontal: SPACING.base, marginBottom: SPACING.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 13,
  },
  filterRow: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.gold + '18',
    borderColor: COLORS.gold,
  },
  filterDot: { width: 7, height: 7, borderRadius: 3.5 },
  filterText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  filterTextActive: { color: COLORS.gold },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  gridRow: { gap: SPACING.sm, marginBottom: SPACING.sm },
  card: { flex: 1, maxWidth: '50%' },
  masonryCard: { padding: SPACING.xs },
  // Story Rings
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  storyRow: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  storyItem: { alignItems: 'center', width: 72 },
  storyName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // Featured Hero
  featuredCard: {
    marginHorizontal: SPACING.base,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  featuredImg: { width: '100%', height: 200 },
  featuredGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  featuredBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: 'rgba(11,17,32,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  featuredBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  featuredInfo: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  featuredName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  featuredRating: { fontSize: 13, fontWeight: '700', color: COLORS.gold },
  featuredDot: { fontSize: 10, color: COLORS.textMuted },
  featuredBookings: { fontSize: 12, color: COLORS.textSecondary },
  featuredRate: { fontSize: 12, color: COLORS.gold, fontWeight: '600' },
});
