/**
 * Day Overview — BabyLuki
 * Horizontal calendar strip, summary card, activity feed, FAB.
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as db from '@/lib/db';
import type { DayViewResponse, DayViewEvent, FeedingSessionResponse } from '@/lib/db';
import { C } from '@/constants/Colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toApiDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Duration from session start to end (total wall-clock time). */
function durationStr(start: string, end: string | null): string | null {
  if (!end) return null;
  const secs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.round(secs / 60)} min`;
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Generate `count` days centred −3 days before `center`. */
function calendarDays(center: Date, count = 14): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(center);
    d.setDate(d.getDate() - 3 + i);
    return d;
  });
}

function sessionName(session: FeedingSessionResponse): string {
  const sides = session.segments.map(s => s.side);
  if (!sides.length) return 'Feed';
  const uniq = [...new Set(sides)];
  if (uniq.length === 1) {
    if (uniq[0] === 'LEFT') return 'Left Breast';
    if (uniq[0] === 'RIGHT') return 'Right Breast';
    if (uniq[0] === 'BOTTLE') return 'Bottle';
  }
  if (sides.some(s => s === 'LEFT' || s === 'RIGHT') && sides.includes('BOTTLE')) return 'Mixed';
  return 'Both Breasts';
}

function sessionIcon(session: FeedingSessionResponse): string {
  return session.segments.every(s => s.side === 'BOTTLE') ? '🍼' : '🤱';
}

function evCounts(events: DayViewEvent[], sessionId: string) {
  const ev = events.filter(e => e.sessionId === sessionId);
  return {
    burps: ev.filter(e => e.type === 'BURP').length,
    spills: ev.filter(e => e.type === 'SPILL').length,
    coughs: ev.filter(e => e.type === 'COUGH').length,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DayScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(new Date());
  const [dayView, setDayView] = useState<DayViewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = toApiDate(new Date());
  const isToday = toApiDate(selected) === todayStr;

  const loadData = useCallback((date: Date) => {
    try {
      setError(null);
      setDayView(db.getDayView(toApiDate(date)));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load');
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(selected); }, [loadData, selected]));

  const days = calendarDays(selected);
  const monthLabel = `${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* App bar */}
      <View style={s.appBar}>
        <Text style={s.brand}>BabyLuki</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(selected); setRefreshing(false); }}
            tintColor={C.primary}
          />
        }
      >
        {/* ── Calendar strip ── */}
        <View style={s.calSection}>
          <View style={s.calHeader}>
            <Text style={s.monthLabel}>{monthLabel}</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity
                style={s.navBtn}
                onPress={() => setSelected(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
              >
                <Text style={s.navBtnText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.navBtn}
                disabled={isToday}
                onPress={() => setSelected(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
              >
                <Text style={[s.navBtnText, isToday && { color: C.outlineVariant }]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dayStrip}
          >
            {days.map((day, i) => {
              const sel = toApiDate(day) === toApiDate(selected);
              const tod = toApiDate(day) === todayStr;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  style={[s.dayTile, sel && s.dayTileSel]}
                  onPress={() => setSelected(new Date(day))}
                >
                  <Text style={[s.dayAbbr, sel && s.dayAbbrSel]}>
                    {DAY_ABBR[day.getDay()]}
                  </Text>
                  <Text style={[s.dayNum, sel && s.dayNumSel]}>
                    {day.getDate()}
                  </Text>
                  {tod && !sel && <View style={s.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : dayView ? (
          <>
            {/* ── Summary card ── */}
            <View style={s.summaryWrap}>
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>FEEDS</Text>
                <Text style={s.summaryCount}>{dayView.totalSessions}</Text>
              </View>
            </View>

            {/* ── Activity list ── */}
            <View style={s.actSection}>
              <Text style={s.actHeader}>
                {isToday ? "Today's Activity" : 'Activity'}
              </Text>

              {dayView.sessions.length === 0 ? (
                /* Empty state */
                <View style={s.empty}>
                  <View style={s.emptyIconWrap}>
                    <Text style={s.emptyIcon}>📋</Text>
                  </View>
                  <Text style={s.emptyTitle}>No activities logged yet</Text>
                  <Text style={s.emptyBody}>
                    {isToday
                      ? 'Tap the + button below to log your first feed.'
                      : 'No feeds recorded for this day.'}
                  </Text>
                </View>
              ) : (
                dayView.sessions.map((session, idx) => {
                  const isLast = idx === dayView.sessions.length - 1;
                  const dur = durationStr(session.startedAt, session.endedAt);
                  const { burps, spills, coughs } = evCounts(dayView.events, session.id);

                  return (
                    <TouchableOpacity
                      key={session.id}
                      activeOpacity={0.7}
                      style={s.actItem}
                      onPress={() => router.push(`/session/${session.id}` as any)}
                    >
                      {/* Icon + timeline line */}
                      <View style={s.actLeft}>
                        <View style={s.actIconWrap}>
                          <Text style={s.actIconText}>{sessionIcon(session)}</Text>
                        </View>
                        {!isLast && <View style={s.timelineLine} />}
                      </View>

                      {/* Content */}
                      <View style={s.actBody}>
                        <View style={s.actRow}>
                          <Text style={s.actName}>{sessionName(session)}</Text>
                          <Text style={s.actTime}>{fmtTime(session.startedAt)}</Text>
                        </View>
                        {dur
                          ? <Text style={s.actDur}>{dur} duration</Text>
                          : !session.endedAt && <Text style={s.actDur}>Ongoing</Text>
                        }
                        {(burps > 0 || spills > 0 || coughs > 0) && (
                          <View style={s.chips}>
                            {burps > 0 && (
                              <View style={[s.chip, s.chipBurp]}>
                                <Text style={[s.chipTxt, s.chipBurpTxt]}>
                                  💨 {burps} {burps === 1 ? 'Burp' : 'Burps'}
                                </Text>
                              </View>
                            )}
                            {spills > 0 && (
                              <View style={[s.chip, s.chipSpill]}>
                                <Text style={[s.chipTxt, s.chipSpillTxt]}>
                                  💧 {spills} {spills === 1 ? 'Spill' : 'Spills'}
                                </Text>
                              </View>
                            )}
                            {coughs > 0 && (
                              <View style={[s.chip, s.chipCough]}>
                                <Text style={[s.chipTxt, s.chipCoughTxt]}>
                                  😤 {coughs} {coughs === 1 ? 'Cough' : 'Coughs'}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                        <View style={s.actDivider} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── FAB (today only) ── */}
      {isToday && (
        <View style={s.fabBar}>
          <TouchableOpacity
            style={s.fab}
            activeOpacity={0.85}
            onPress={() => router.push('/feed' as any)}
          >
            <Text style={s.fabPlus}>＋</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },

  // App bar
  appBar: {
    height: 56,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant + '33',
  },
  brand: { fontSize: 20, fontWeight: '700', color: C.brand },

  // Calendar
  calSection: { paddingTop: 16, paddingHorizontal: 24 },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: { fontSize: 18, fontWeight: '600', color: C.onSurface },
  navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 24, color: C.onSurfaceVariant },
  dayStrip: { gap: 8, paddingVertical: 4 },
  dayTile: {
    width: 52,
    height: 76,
    borderRadius: 16,
    backgroundColor: C.surfaceLow,
    borderWidth: 1,
    borderColor: C.outlineVariant + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTileSel: {
    backgroundColor: C.primary,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dayAbbr: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: C.onSurfaceVariant,
  },
  dayAbbrSel: { color: '#fff' },
  dayNum: { fontSize: 20, fontWeight: '700', color: C.onSurface, marginTop: 2 },
  dayNumSel: { color: '#fff' },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.primary,
    marginTop: 4,
  },

  // Error
  errorBox: {
    margin: 24,
    padding: 16,
    backgroundColor: C.errorContainer,
    borderRadius: 16,
  },
  errorText: { color: C.onErrorContainer, textAlign: 'center', fontSize: 14 },

  // Summary card
  summaryWrap: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: C.surfaceHigh,
    borderRadius: 20,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant + '33',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: C.outline,
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 52,
    fontWeight: '700',
    color: C.primary,
    lineHeight: 56,
  },

  // Activity section
  actSection: { paddingHorizontal: 24, paddingTop: 16 },
  actHeader: { fontSize: 18, fontWeight: '700', color: C.onSurface, marginBottom: 20 },

  // Activity items — timeline layout
  actItem: { flexDirection: 'row', gap: 16 },
  actLeft: { alignItems: 'center', width: 40 },
  actIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actIconText: { fontSize: 20 },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: C.outlineVariant + '33',
    marginTop: 4,
    borderRadius: 1,
    minHeight: 24,
  },
  actBody: { flex: 1, paddingBottom: 20, minHeight: 40 },
  actRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  actName: { fontSize: 16, fontWeight: '600', color: C.onSurface, flex: 1, marginRight: 8 },
  actTime: { fontSize: 13, fontWeight: '500', color: C.outline },
  actDur: { fontSize: 14, color: C.onSurfaceVariant, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999 },
  chipTxt: { fontSize: 11, fontWeight: '600' },
  chipBurp: { backgroundColor: C.secondaryContainer },
  chipBurpTxt: { color: C.onSecondaryContainer },
  chipSpill: { backgroundColor: C.tertiaryContainer + '55' },
  chipSpillTxt: { color: C.onTertiaryContainer },
  chipCough: { backgroundColor: C.errorContainer },
  chipCoughTxt: { color: C.onErrorContainer },
  actDivider: {
    height: 1,
    backgroundColor: C.outlineVariant + '30',
    marginTop: 20,
  },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // FAB
  fabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 36,
    paddingTop: 12,
    alignItems: 'center',
    backgroundColor: C.background + 'CC',
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant + '33',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPlus: {
    fontSize: 32,
    color: C.onPrimary,
    lineHeight: 36,
    fontWeight: '300',
  },
});
