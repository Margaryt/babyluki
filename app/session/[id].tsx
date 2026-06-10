/**
 * Session Detail screen — BabyLuki
 * Time window card, total duration, feeding sequence timeline, event summary.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as db from '@/lib/db';
import type { FeedingSessionDetailResponse, SegmentSide } from '@/lib/db';
import { C } from '@/constants/Colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function segmentDuration(start: string, end: string | null): string {
  if (!end) return 'ongoing';
  const secs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function totalDurationLabel(minutes: number | null): string {
  if (minutes === null) return 'In progress';
  const secs = Math.round(minutes * 60);
  if (secs < 60) return `${secs}s Total Duration`;
  const mins = Math.round(minutes);
  if (mins < 60) return `${mins} min Total Duration`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m Total Duration` : `${h}h Total Duration`;
}

function sideName(side: SegmentSide): string {
  switch (side) {
    case 'LEFT': return 'Left Breast';
    case 'RIGHT': return 'Right Breast';
    case 'BOTTLE': return 'Bottle';
  }
}

function isBreast(side: SegmentSide): boolean {
  return side === 'LEFT' || side === 'RIGHT';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<FeedingSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(() => {
    if (!id) return;
    try {
      setError(null);
      const d = db.getSessionDetail(id);
      if (!d) { setError('Session not found'); return; }
      setDetail(d);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load session');
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDetail]);

  const hasEvents = detail
    ? detail.burpCount > 0 || detail.spillCount > 0 || detail.coughCount > 0
    : false;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.brand}>BabyLuki</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.contentInner}
      >
        {/* Page title */}
        <Text style={s.pageTitle}>Session Detail</Text>

        {/* Loading */}
        {loading && (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
        )}

        {/* Error */}
        {error && !loading && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); fetchDetail(); setLoading(false); }}>
              <Text style={s.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && detail && (
          <>
            {/* ── Session window card ── */}
            <View style={s.timeCard}>
              <Text style={s.timeCardLabel}>SESSION WINDOW</Text>
              <View style={s.timeCardRow}>
                <Text style={s.timeCardTime}>{fmtTime(detail.startedAt)}</Text>
                <Text style={s.timeCardDash}>—</Text>
                <Text style={s.timeCardTime}>
                  {detail.endedAt ? fmtTime(detail.endedAt) : 'ongoing'}
                </Text>
              </View>
            </View>

            {/* ── Total duration card ── */}
            <View style={s.durationCard}>
              <View style={s.durationIconWrap}>
                <Text style={s.durationIconText}>⏱</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.durationTitle}>
                  {totalDurationLabel(detail.totalDurationMinutes)}
                </Text>
                <Text style={s.durationSub}>
                  {detail.totalDurationMinutes !== null ? 'Full session completed' : 'Session in progress'}
                </Text>
              </View>
            </View>

            {/* ── Feeding sequence ── */}
            <View style={s.section}>
              <Text style={s.sectionHeader}>Feeding Sequence</Text>

              {detail.segments.length === 0 ? (
                <Text style={s.emptyText}>No segments recorded</Text>
              ) : (
                <View style={s.timeline}>
                  {/* Dashed connector line (only when >1 segment) */}
                  {detail.segments.length > 1 && (
                    <View style={s.timelineLine} />
                  )}

                  {detail.segments.map((seg, idx) => {
                    const breast = isBreast(seg.side);
                    return (
                      <View key={seg.id} style={s.timelineItem}>
                        {/* Numbered circle */}
                        <View style={[
                          s.timelineNum,
                          { backgroundColor: breast ? C.primary : C.tertiary },
                        ]}>
                          <Text style={s.timelineNumTxt}>{idx + 1}</Text>
                        </View>

                        {/* Segment card */}
                        <View style={s.timelineCard}>
                          <View style={s.timelineCardLeft}>
                            <Text style={s.timelineIcon}>
                              {breast ? '🤱' : '🍼'}
                            </Text>
                            <Text style={s.timelineName}>{sideName(seg.side)}</Text>
                          </View>
                          <Text style={[
                            s.timelineDuration,
                            { color: breast ? C.primary : C.tertiary },
                          ]}>
                            {segmentDuration(seg.startedAt, seg.endedAt)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ── Event summary ── */}
            {hasEvents && (
              <View style={s.section}>
                <Text style={s.sectionHeader}>Event Summary</Text>
                <View style={s.eventRow}>
                  <View style={[s.eventCard, s.eventCardBurp]}>
                    <View style={s.eventIconWrap}>
                      <Text style={s.eventIconText}>💨</Text>
                    </View>
                    <Text style={[s.eventCount, { color: C.secondary }]}>
                      {detail.burpCount}
                    </Text>
                    <Text style={[s.eventLabel, { color: C.onSecondaryContainer }]}>
                      Burps
                    </Text>
                  </View>

                  <View style={[s.eventCard, s.eventCardSpill]}>
                    <View style={s.eventIconWrap}>
                      <Text style={s.eventIconText}>💧</Text>
                    </View>
                    <Text style={[s.eventCount, { color: C.tertiary }]}>
                      {detail.spillCount}
                    </Text>
                    <Text style={[s.eventLabel, { color: C.onTertiaryContainer }]}>
                      Spills
                    </Text>
                  </View>

                  <View style={[s.eventCard, s.eventCardCough]}>
                    <View style={s.eventIconWrap}>
                      <Text style={s.eventIconText}>😤</Text>
                    </View>
                    <Text style={[s.eventCount, { color: C.error }]}>
                      {detail.coughCount}
                    </Text>
                    <Text style={[s.eventLabel, { color: C.onErrorContainer }]}>
                      Coughs
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Decorative divider */}
            <View style={s.decorLine} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },

  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant + '33',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { fontSize: 28, color: C.primary, fontWeight: '300', lineHeight: 32 },
  brand: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: C.brand,
  },

  contentInner: { paddingHorizontal: 24, paddingBottom: 48 },

  // Page title
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: C.onSurface,
    marginTop: 24,
    marginBottom: 24,
  },

  // Error
  errorBox: {
    backgroundColor: C.errorContainer,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    alignItems: 'center',
  },
  errorText: { color: C.onErrorContainer, fontSize: 13, marginBottom: 8, textAlign: 'center' },
  retryText: { color: C.primary, fontSize: 13, fontWeight: '600' },

  // Session window card
  timeCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  timeCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: C.primary,
    opacity: 0.7,
    marginBottom: 8,
  },
  timeCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeCardTime: { fontSize: 22, fontWeight: '600', color: C.onSurface },
  timeCardDash: { fontSize: 20, fontWeight: '300', color: C.outlineVariant },

  // Total duration card
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: C.primaryContainer + '33',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  durationIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  durationIconText: { fontSize: 22 },
  durationTitle: { fontSize: 16, fontWeight: '600', color: C.onPrimaryContainer },
  durationSub: { fontSize: 12, fontWeight: '600', color: C.primary, opacity: 0.8, marginTop: 2 },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: C.onSurfaceVariant,
    letterSpacing: 0.1,
    marginBottom: 20,
  },
  emptyText: { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', paddingVertical: 20 },

  // Timeline
  timeline: { position: 'relative', paddingLeft: 4 },
  timelineLine: {
    position: 'absolute',
    left: 4 + 15,       // padding + half of 32px circle (16) - 1
    top: 32,
    bottom: 16,
    width: 2,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.outlineVariant + '55',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  timelineNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderWidth: 3,
    borderColor: C.background,
  },
  timelineNumTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  timelineCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  timelineCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineIcon: { fontSize: 22 },
  timelineName: { fontSize: 15, fontWeight: '600', color: C.onSurface },
  timelineDuration: { fontSize: 15, fontWeight: '700' },

  // Event summary row
  eventRow: { flexDirection: 'row', gap: 12 },
  eventCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  eventCardBurp: {
    backgroundColor: C.secondaryContainer + '4D',
    borderColor: C.secondaryContainer,
  },
  eventCardSpill: {
    backgroundColor: C.tertiaryContainer + '33',
    borderColor: C.tertiaryContainer + '66',
  },
  eventCardCough: {
    backgroundColor: C.errorContainer + '4D',
    borderColor: C.errorContainer,
  },
  eventIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIconText: { fontSize: 20 },
  eventCount: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  eventLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Decorative bottom
  decorLine: {
    height: 4,
    borderRadius: 2,
    backgroundColor: C.primaryContainer,
    opacity: 0.3,
    marginTop: 20,
    marginHorizontal: 60,
  },
});
