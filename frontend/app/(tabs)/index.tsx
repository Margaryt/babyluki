import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import TopNav from '@/components/TopNav';
import AddEventSheet from '@/components/AddEventSheet';
import { feedingApi, hiccupApi } from '@/lib/api';
import type {
  DayViewResponse,
  DayViewEvent,
  HiccupResponse,
  FeedingSessionResponse,
  SegmentSide,
} from '@/lib/api';
import { BABY_ID, BABY_NAME } from '@/constants/Baby';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO timestamp as HH:MM. */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Compute human-friendly duration between two ISO timestamps. */
function durationStr(start: string, end: string | null): string | null {
  if (!end) return null;
  const secs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.round(secs / 60)} min`;
}

/** Short duration for tag labels. */
function durationShort(start: string, end: string | null): string {
  if (!end) return '';
  const secs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return ` ${secs}s`;
  return ` ${Math.round(secs / 60)}m`;
}

/** Map segment side to a display-friendly label + type. */
function segmentLabel(side: SegmentSide, startedAt: string, endedAt: string | null, volumeMl: number | null) {
  const durStr = durationShort(startedAt, endedAt);
  switch (side) {
    case 'LEFT':
      return { label: `L${durStr}`, type: 'left' as const };
    case 'RIGHT':
      return { label: `R${durStr}`, type: 'right' as const };
    case 'BOTTLE':
      return { label: `🍼${volumeMl ? ` ${volumeMl}ml` : ''}${durStr}`, type: 'bottle' as const };
  }
}

/** Map event type to emoji. */
function eventEmoji(type: string): string {
  switch (type) {
    case 'BURP': return '💨';
    case 'SPILL': return '💧';
    case 'COUGH': return '😤';
    default: return '?';
  }
}

/** Map event type to tag type key. */
function eventTagType(type: string): string {
  switch (type) {
    case 'BURP': return 'burp';
    case 'SPILL': return 'spill';
    case 'COUGH': return 'cough';
    default: return 'burp';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DayScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = isDark ? dark : light;
  const router = useRouter();

  const [dayView, setDayView] = useState<DayViewResponse | null>(null);
  const [hiccups, setHiccups] = useState<HiccupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [dv, hic] = await Promise.all([
        feedingApi.getDayView(BABY_ID),
        hiccupApi.getByDate(BABY_ID),
      ]);
      setDayView(dv);
      setHiccups(hic);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData().finally(() => setLoading(false));
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Build summary pills from real data
  const pills = dayView
    ? [
        { emoji: '🍼', value: String(dayView.totalSessions), label: 'feeds' },
        { emoji: '💨', value: String(dayView.totalBurps), label: 'burps' },
        { emoji: '💧', value: String(dayView.totalSpills), label: 'spills' },
        { emoji: '😤', value: String(dayView.totalCoughs), label: 'coughs' },
        { emoji: '🫢', value: String(hiccups.length), label: hiccups.length === 1 ? 'hiccup' : 'hiccups' },
      ]
    : [];

  // Group events by sessionId for display on cards
  const eventsBySession = new Map<string, DayViewEvent[]>();
  if (dayView) {
    for (const ev of dayView.events) {
      if (ev.sessionId) {
        const arr = eventsBySession.get(ev.sessionId) ?? [];
        arr.push(ev);
        eventsBySession.set(ev.sessionId, arr);
      }
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{dateStr}</Text>
        <Text style={[styles.headerSub, { color: c.textSecondary }]}>{BABY_NAME}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top navigation */}
        <TopNav />

        {/* Loading state */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={c.textSecondary} />
          </View>
        )}

        {/* Error state */}
        {error && !loading && (
          <View style={[styles.errorBox, isDark && styles.errorBoxDark]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); fetchData().finally(() => setLoading(false)); }}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Data loaded */}
        {!loading && !error && dayView && (
          <>
            {/* Summary pills */}
            <View style={styles.pillRow}>
              {pills.map((p, i) => (
                <View key={i} style={[styles.pill, { backgroundColor: c.card }]}>
                  <Text style={styles.pillEmoji}>{p.emoji}</Text>
                  <Text style={[styles.pillValue, { color: c.text }]}>{p.value}</Text>
                  {p.label ? (
                    <Text style={[styles.pillLabel, { color: c.textSecondary }]}>{p.label}</Text>
                  ) : null}
                </View>
              ))}
            </View>

            {/* AI Summary card */}
            <View style={[styles.aiCard, isDark && styles.aiCardDark]}>
              <Text style={styles.aiBadge}>✨ AI Summary</Text>
              <Text style={[styles.aiText, { color: isDark ? '#ddd' : '#333' }]}>
                {dayView.totalSessions === 0
                  ? `No feeds recorded yet today. Tap "Add event" to start tracking.`
                  : `${BABY_NAME} has had ${dayView.totalSessions} feed${dayView.totalSessions === 1 ? '' : 's'} today, totalling ${dayView.totalFeedingMinutes} minutes of active feeding.`}
              </Text>
            </View>

            {/* Active hiccups banner */}
            {hiccups.filter((h) => !h.endedAt).map((h) => (
              <View key={h.id} style={[styles.banner, styles.bannerHiccup]}>
                <View style={styles.pulse} />
                <View style={styles.bannerInfo}>
                  <Text style={styles.bannerTitle}>Hiccups in progress</Text>
                  <Text style={styles.bannerSub}>Started {fmtTime(h.startedAt)}</Text>
                </View>
              </View>
            ))}

            {/* Section: Feeds */}
            {dayView.sessions.length > 0 && (
              <Text style={[styles.section, { color: c.textSecondary }]}>Feeds</Text>
            )}

            {dayView.sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                events={eventsBySession.get(session.id) ?? []}
                isDark={isDark}
                c={c}
                onPress={() => router.push(`/session/${session.id}` as any)}
              />
            ))}

            {/* Completed hiccups */}
            {hiccups.filter((h) => h.endedAt).length > 0 && (
              <>
                <Text style={[styles.section, { color: c.textSecondary }]}>Hiccups</Text>
                {hiccups
                  .filter((h) => h.endedAt)
                  .map((h) => (
                    <View key={h.id} style={[styles.evStandalone, { backgroundColor: c.card, borderColor: c.border }]}>
                      <View style={[styles.evIcon, { backgroundColor: '#f3e5f5' }]}>
                        <Text style={{ fontSize: 18 }}>🫢</Text>
                      </View>
                      <View style={styles.evInfo}>
                        <Text style={[styles.evType, { color: c.text }]}>Hiccups</Text>
                        <Text style={[styles.evTime, { color: c.textSecondary }]}>
                          {fmtTime(h.startedAt)} – {fmtTime(h.endedAt!)}
                        </Text>
                      </View>
                      <View style={[styles.evDur, { backgroundColor: '#f3e5f5' }]}>
                        <Text style={{ fontSize: 10, color: '#7b1fa2' }}>
                          {durationStr(h.startedAt, h.endedAt)}
                        </Text>
                      </View>
                    </View>
                  ))}
              </>
            )}

            {/* Empty state */}
            {dayView.sessions.length === 0 && hiccups.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                  No activity recorded today yet
                </Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* Add event button */}
      <View style={[styles.addBar, { backgroundColor: c.bg, borderTopColor: c.border }]}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setSheetVisible(true)}>
          <Text style={styles.addBtnText}>＋ Add event</Text>
        </TouchableOpacity>
      </View>

      {/* Add event bottom sheet */}
      <AddEventSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onFeed={() => router.push('/feed' as any)}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Session card sub-component
// ---------------------------------------------------------------------------

function SessionCard({
  session,
  events,
  isDark,
  c,
  onPress,
}: {
  session: FeedingSessionResponse;
  events: DayViewEvent[];
  isDark: boolean;
  c: typeof light;
  onPress: () => void;
}) {
  const dur = durationStr(session.startedAt, session.endedAt);
  const timeRange = `${fmtTime(session.startedAt)}${session.endedAt ? ` – ${fmtTime(session.endedAt)}` : ' – ongoing'}`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={styles.cardHead}>
        <Text style={[styles.cardTime, { color: c.text }]}>{timeRange}</Text>
        <View style={[styles.badge, { backgroundColor: isDark ? '#3A3A3C' : '#f0f0f0' }]}>
          <Text style={[styles.badgeText, { color: c.textSecondary }]}>
            {dur ?? 'active'}
          </Text>
        </View>
      </View>

      {/* Segment tags */}
      <View style={styles.tagRow}>
        {session.segments.map((seg) => {
          const { label, type } = segmentLabel(seg.side, seg.startedAt, seg.endedAt, seg.volumeMl);
          return (
            <View key={seg.id} style={[styles.tag, tagStyles[type]]}>
              <Text style={[styles.tagText, tagTextStyles[type]]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Event chips */}
      {events.length > 0 && (
        <View style={[styles.eventRow, { borderTopColor: c.border }]}>
          {events.map((ev) => {
            const tType = eventTagType(ev.type);
            return (
              <View key={ev.id} style={[styles.tag, tagStyles[tType]]}>
                <Text style={[styles.tagText, tagTextStyles[tType]]}>
                  {eventEmoji(ev.type)} {fmtTime(ev.timestamp)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Theme palettes
// ---------------------------------------------------------------------------
const light = {
  bg: '#fff',
  text: '#1a1a1a',
  textSecondary: '#888',
  card: '#fafafa',
  border: '#eee',
};

const dark = {
  bg: '#1C1C1E',
  text: '#F5F5F5',
  textSecondary: '#999',
  card: '#2C2C2E',
  border: '#38383A',
};

// ---------------------------------------------------------------------------
// Tag colour maps
// ---------------------------------------------------------------------------
const tagStyles: Record<string, object> = {
  left: { backgroundColor: '#e8f0fe' },
  right: { backgroundColor: '#fce8e6' },
  bottle: { backgroundColor: '#e6f4ea' },
  burp: { backgroundColor: '#fff3e0' },
  spill: { backgroundColor: '#e3f2fd' },
  cough: { backgroundColor: '#fce4ec' },
};

const tagTextStyles: Record<string, object> = {
  left: { color: '#1967d2' },
  right: { color: '#c5221f' },
  bottle: { color: '#137333' },
  burp: { color: '#e65100' },
  spill: { color: '#1565c0' },
  cough: { color: '#c62828' },
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },

  content: { flex: 1, paddingHorizontal: 16 },

  // Loading / error
  center: { paddingVertical: 60, alignItems: 'center' },
  errorBox: {
    backgroundColor: '#fce4ec',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    alignItems: 'center',
  },
  errorBoxDark: { backgroundColor: '#3a1a1a' },
  errorText: { color: '#c62828', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  retryText: { color: '#1967d2', fontSize: 13, fontWeight: '600' },

  // Summary pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillEmoji: { fontSize: 12 },
  pillValue: { fontWeight: '700', fontSize: 12 },
  pillLabel: { fontSize: 12 },

  // AI Summary card
  aiCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#d0e3ff',
  },
  aiCardDark: { backgroundColor: '#1a2a3a', borderColor: '#2a4a6a' },
  aiBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1967d2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  aiText: { fontSize: 13, lineHeight: 19 },

  // Active hiccup banner
  banner: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerHiccup: { backgroundColor: '#f3e5f5' },
  pulse: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#7b1fa2' },
  bannerInfo: { flex: 1 },
  bannerTitle: { fontWeight: '600', fontSize: 13, color: '#4a148c' },
  bannerSub: { fontSize: 11, color: '#7b1fa2' },

  // Section header
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },

  // Feed cards
  card: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTime: { fontWeight: '600', fontSize: 14 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  badgeText: { fontSize: 11 },

  // Tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 9 },
  tagText: { fontSize: 10, fontWeight: '500' },

  // Event chips row
  eventRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6, paddingTop: 7, borderTopWidth: 1 },

  // Standalone events (hiccups)
  evStandalone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  evIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  evInfo: { flex: 1 },
  evType: { fontWeight: '600', fontSize: 13 },
  evTime: { fontSize: 11 },
  evDur: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6 },

  // Empty state
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14 },

  // Add event button
  addBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  addBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
