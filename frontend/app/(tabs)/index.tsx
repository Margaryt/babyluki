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
import { feedingApi } from '@/lib/api';
import type {
  DayViewResponse,
  DayViewEvent,
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  /** Format YYYY-MM-DD in local timezone for API calls. */
  const toApiDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isToday =
    toApiDate(selectedDate) === toApiDate(new Date());

  const dateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const goBack = () => {
    setLoading(true);
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const goForward = () => {
    if (isToday) return;
    setLoading(true);
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const fetchData = useCallback(async (date: Date) => {
    try {
      setError(null);
      const dateParam = toApiDate(date);
      const dv = await feedingApi.getDayView(BABY_ID, dateParam);
      setDayView(dv);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(selectedDate).finally(() => setLoading(false));
    }, [fetchData, selectedDate])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(selectedDate);
    setRefreshing(false);
  }, [fetchData, selectedDate]);

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
      {/* Header with date navigation */}
      <View style={styles.header}>
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={goBack} style={styles.navArrow}>
            <Text style={[styles.navArrowText, { color: c.text }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={[styles.headerTitle, { color: c.text }]}>{dateStr}</Text>
            {isToday && (
              <Text style={[styles.todayBadge, { color: '#1967d2' }]}>Today</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={goForward}
            style={styles.navArrow}
            disabled={isToday}
          >
            <Text
              style={[
                styles.navArrowText,
                { color: isToday ? c.border : c.text },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSub, { color: c.textSecondary }]}>{BABY_NAME}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
            <TouchableOpacity onPress={() => { setLoading(true); fetchData(selectedDate).finally(() => setLoading(false)); }}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Data loaded */}
        {!loading && !error && dayView && (
          <>
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

            {/* Empty state */}
            {dayView.sessions.length === 0 && (
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

      {/* Add feed button — only on today */}
      {isToday && (
        <View style={[styles.addBar, { backgroundColor: c.bg, borderTopColor: c.border }]}>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/feed' as any)}>
            <Text style={styles.addBtnText}>＋ Add feed</Text>
          </TouchableOpacity>
        </View>
      )}
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
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navArrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navArrowText: { fontSize: 28, fontWeight: '300', lineHeight: 32 },
  dateCenter: { flex: 1, alignItems: 'center' },
  todayBadge: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2, textAlign: 'center' },

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
