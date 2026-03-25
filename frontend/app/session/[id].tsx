/**
 * Session Detail screen — Screen 3 from the mockup.
 * Shows timeline of segments and events, summary pills, and stat rows.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { feedingApi } from '@/lib/api';
import type { FeedingSessionDetailResponse, SegmentSide } from '@/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function durationStr(start: string, end: string | null): string | null {
  if (!end) return null;
  const totalSecs = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000
  );
  if (totalSecs < 60) return `${totalSecs}s`;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return secs > 0 ? `${mins} min ${secs}s` : `${mins} min`;
}

/** Format a minutes value (from API) with seconds for short durations. */
function fmtMinutes(mins: number | null): string {
  if (mins === null) return 'ongoing';
  if (mins < 1) {
    const secs = Math.round(mins * 60);
    return secs === 0 ? '< 1s' : `${secs}s`;
  }
  return `${Math.round(mins)} min`;
}

function sideName(side: SegmentSide): string {
  switch (side) {
    case 'LEFT':
      return 'Left breast';
    case 'RIGHT':
      return 'Right breast';
    case 'BOTTLE':
      return 'Bottle';
  }
}

function eventLabel(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function eventEmoji(type: string): string {
  switch (type) {
    case 'BURP':
      return '💨';
    case 'SPILL':
      return '💧';
    case 'COUGH':
      return '😤';
    default:
      return '?';
  }
}

// Dot colour per type
function dotColor(type: string): string {
  switch (type) {
    case 'segment':
      return '#1967d2';
    case 'BURP':
      return '#e65100';
    case 'SPILL':
      return '#1565c0';
    case 'COUGH':
      return '#c62828';
    default:
      return '#888';
  }
}

function eventTextColor(type: string): string {
  switch (type) {
    case 'BURP':
      return '#e65100';
    case 'SPILL':
      return '#1565c0';
    case 'COUGH':
      return '#c62828';
    default:
      return '#1a1a1a';
  }
}

// Build a unified, chronologically sorted timeline from segments + events
interface TimelineItem {
  key: string;
  kind: 'segment' | 'event';
  sortTime: number;
  // Segment fields
  side?: SegmentSide;
  startedAt?: string;
  endedAt?: string | null;
  // Event fields
  eventType?: string;
  timestamp?: string;
}

function buildTimeline(
  detail: FeedingSessionDetailResponse
): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const seg of detail.segments) {
    items.push({
      key: `seg-${seg.id}`,
      kind: 'segment',
      sortTime: new Date(seg.startedAt).getTime(),
      side: seg.side,
      startedAt: seg.startedAt,
      endedAt: seg.endedAt,
    });
  }

  for (const ev of detail.events) {
    items.push({
      key: `ev-${ev.timestamp}-${ev.type}`,
      kind: 'event',
      sortTime: new Date(ev.timestamp).getTime(),
      eventType: ev.type,
      timestamp: ev.timestamp,
    });
  }

  items.sort((a, b) => a.sortTime - b.sortTime);
  return items;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SessionDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = isDark ? dark : light;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [detail, setDetail] = useState<FeedingSessionDetailResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const d = await feedingApi.getSession(id);
      setDetail(d);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load session');
    }
  }, [id]);

  useEffect(() => {
    fetchDetail().finally(() => setLoading(false));
  }, [fetchDetail]);

  const timeline = detail ? buildTimeline(detail) : [];

  // Compute time-to-first-burp
  let timeToFirstBurp: string | null = null;
  if (detail && detail.events.length > 0) {
    const firstBurp = detail.events.find((e) => e.type === 'BURP');
    if (firstBurp) {
      const mins = Math.round(
        (new Date(firstBurp.timestamp).getTime() -
          new Date(detail.startedAt).getTime()) /
          60_000
      );
      timeToFirstBurp = `${mins} min`;
    }
  }

  const timeRange = detail
    ? `${fmtTime(detail.startedAt)}${detail.endedAt ? ` – ${fmtTime(detail.endedAt)}` : ' – ongoing'}`
    : '';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Day overview</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>
          Session Detail
        </Text>
        {detail && (
          <Text style={[styles.headerSub, { color: c.textSecondary }]}>
            {timeRange}
          </Text>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={c.textSecondary} />
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={[styles.errorBox, isDark && styles.errorBoxDark]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                fetchDetail().finally(() => setLoading(false));
              }}
            >
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {!loading && !error && detail && (
          <>
            {/* Summary pills */}
            <View style={styles.pillRow}>
              {detail.totalDurationMinutes !== null && (
                <View style={[styles.pill, { backgroundColor: c.card }]}>
                  <Text style={[styles.pillValue, { color: c.text }]}>
                    {fmtMinutes(detail.totalDurationMinutes)}
                  </Text>
                  <Text
                    style={[styles.pillLabel, { color: c.textSecondary }]}
                  >
                    total
                  </Text>
                </View>
              )}
              <View style={[styles.pill, { backgroundColor: c.card }]}>
                <Text style={[styles.pillValue, { color: c.text }]}>
                  {fmtMinutes(detail.activeFeedingMinutes)}
                </Text>
                <Text style={[styles.pillLabel, { color: c.textSecondary }]}>
                  active
                </Text>
              </View>
              {detail.burpCount > 0 && (
                <View style={[styles.pill, { backgroundColor: c.card }]}>
                  <Text style={styles.pillEmoji}>💨</Text>
                  <Text style={[styles.pillValue, { color: c.text }]}>
                    {detail.burpCount}
                  </Text>
                </View>
              )}
              {detail.spillCount > 0 && (
                <View style={[styles.pill, { backgroundColor: c.card }]}>
                  <Text style={styles.pillEmoji}>💧</Text>
                  <Text style={[styles.pillValue, { color: c.text }]}>
                    {detail.spillCount}
                  </Text>
                </View>
              )}
              {detail.coughCount > 0 && (
                <View style={[styles.pill, { backgroundColor: c.card }]}>
                  <Text style={styles.pillEmoji}>😤</Text>
                  <Text style={[styles.pillValue, { color: c.text }]}>
                    {detail.coughCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Timeline */}
            <Text style={[styles.section, { color: c.textSecondary }]}>
              Timeline
            </Text>
            <View style={styles.timeline}>
              {timeline.map((item, i) => {
                const isLast = i === timeline.length - 1;
                const color =
                  item.kind === 'segment'
                    ? dotColor('segment')
                    : dotColor(item.eventType!);

                return (
                  <View key={item.key} style={styles.tlItem}>
                    {/* Rail */}
                    <View style={styles.tlRail}>
                      <View
                        style={[styles.tlDot, { backgroundColor: color }]}
                      />
                      {!isLast && (
                        <View
                          style={[
                            styles.tlLine,
                            { backgroundColor: isDark ? '#444' : '#e0e0e0' },
                          ]}
                        />
                      )}
                    </View>

                    {/* Body */}
                    <View style={styles.tlBody}>
                      {item.kind === 'segment' ? (
                        <>
                          <Text style={[styles.tlTitle, { color: c.text }]}>
                            {sideName(item.side!)}
                          </Text>
                          <Text
                            style={[
                              styles.tlSub,
                              { color: c.textSecondary },
                            ]}
                          >
                            {fmtTime(item.startedAt!)}
                            {item.endedAt
                              ? ` – ${fmtTime(item.endedAt)} · ${durationStr(item.startedAt!, item.endedAt)}`
                              : ' – ongoing'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text
                            style={[
                              styles.tlTitle,
                              { color: eventTextColor(item.eventType!) },
                            ]}
                          >
                            {eventLabel(item.eventType!)}
                          </Text>
                          <Text
                            style={[
                              styles.tlSub,
                              { color: c.textSecondary },
                            ]}
                          >
                            {fmtTime(item.timestamp!)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Empty timeline */}
            {timeline.length === 0 && (
              <Text
                style={{
                  fontSize: 13,
                  color: c.textSecondary,
                  textAlign: 'center',
                  paddingVertical: 20,
                }}
              >
                No segments or events recorded
              </Text>
            )}

            {/* Stat rows */}
            <View style={{ height: 16 }} />
            <View
              style={[styles.statRow, { borderBottomColor: c.border }]}
            >
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>
                Total duration
              </Text>
              <Text style={[styles.statValue, { color: c.text }]}>
                {fmtMinutes(detail.totalDurationMinutes)}
              </Text>
            </View>
            <View
              style={[styles.statRow, { borderBottomColor: c.border }]}
            >
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>
                Active feeding
              </Text>
              <Text style={[styles.statValue, { color: c.text }]}>
                {fmtMinutes(detail.activeFeedingMinutes)}
              </Text>
            </View>
            <View
              style={[styles.statRow, { borderBottomColor: c.border }]}
            >
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>
                Burps
              </Text>
              <Text style={[styles.statValue, { color: c.text }]}>
                {detail.burpCount}
              </Text>
            </View>
            <View
              style={[styles.statRow, { borderBottomColor: c.border }]}
            >
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>
                Spills
              </Text>
              <Text style={[styles.statValue, { color: c.text }]}>
                {detail.spillCount}
              </Text>
            </View>
            <View
              style={[styles.statRow, { borderBottomColor: c.border }]}
            >
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>
                Coughs
              </Text>
              <Text style={[styles.statValue, { color: c.text }]}>
                {detail.coughCount}
              </Text>
            </View>
            {timeToFirstBurp && (
              <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
                <Text
                  style={[styles.statLabel, { color: c.textSecondary }]}
                >
                  Time to first burp
                </Text>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {timeToFirstBurp}
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Theme palettes
// ---------------------------------------------------------------------------
const light = {
  bg: '#fff',
  text: '#1a1a1a',
  textSecondary: '#888',
  card: '#f5f5f5',
  border: '#f0f0f0',
};

const dark = {
  bg: '#1C1C1E',
  text: '#F5F5F5',
  textSecondary: '#999',
  card: '#2C2C2E',
  border: '#38383A',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backLink: { fontSize: 13, color: '#1967d2', marginBottom: 4 },
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
  errorText: {
    color: '#c62828',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryText: { color: '#1967d2', fontSize: 13, fontWeight: '600' },

  // Summary pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 10,
  },
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

  // Section
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },

  // Timeline
  timeline: { paddingHorizontal: 4 },
  tlItem: { flexDirection: 'row', gap: 10 },
  tlRail: {
    width: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  tlDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 6,
  },
  tlLine: {
    flex: 1,
    width: 2,
    marginVertical: 3,
  },
  tlBody: {
    flex: 1,
    paddingBottom: 14,
  },
  tlTitle: { fontWeight: '600', fontSize: 13 },
  tlSub: { fontSize: 11, marginTop: 1 },

  // Stat rows
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 13, fontWeight: '600' },
});
