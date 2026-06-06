/**
 * Feed screen — handles the full feeding session lifecycle:
 * 1. "New Feed" — choose a side to start the first segment
 * 2. "Active Feed" — timer running, stop segment, log events
 * 3. "Between Segments" — segment paused, start next or end feed
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as db from '@/lib/db';
import type {
  FeedingSessionResponse,
  FeedingSegmentResponse,
  FeedingEventResponse,
  SegmentSide,
} from '@/lib/db';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function durationStr(start: string, end: string | null): string | null {
  if (!end) return null;
  const secs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.round(secs / 60)} min`;
}

function sideName(side: SegmentSide): string {
  switch (side) {
    case 'LEFT': return 'Left breast';
    case 'RIGHT': return 'Right breast';
    case 'BOTTLE': return 'Bottle';
  }
}

function eventEmoji(type: string): string {
  switch (type) {
    case 'BURP': return '💨';
    case 'SPILL': return '💧';
    case 'COUGH': return '😤';
    default: return '?';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FeedPhase = 'new' | 'active' | 'between';

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = isDark ? dark : light;
  const router = useRouter();

  // Session state
  const [session, setSession] = useState<FeedingSessionResponse | null>(null);
  const [activeSegment, setActiveSegment] = useState<FeedingSegmentResponse | null>(null);
  const [events, setEvents] = useState<FeedingEventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<FeedPhase>('new');

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Start a ticking timer from a given start time
  const startTimer = useCallback((from: Date) => {
    startTimeRef.current = from;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = new Date();
      setElapsed(Math.floor((now.getTime() - from.getTime()) / 1000));
    }, 1000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  /** Create a new feeding session. */
  const createSession = useCallback((): FeedingSessionResponse | null => {
    try {
      const s = db.startSession(new Date().toISOString());
      setSession(s);
      return s;
    } catch (err: any) {
      if (err.message?.includes('already active')) {
        Alert.alert('Session active', 'A feeding session is already in progress. End it before starting a new one.');
      } else {
        Alert.alert('Error', err.message ?? 'Failed to start session');
      }
      return null;
    }
  }, []);

  /** Start a segment (Left / Right / Bottle). Creates session first if needed. */
  const startSegment = useCallback((side: SegmentSide) => {
    setLoading(true);
    try {
      let s = session;
      if (!s) {
        s = createSession();
        if (!s) { setLoading(false); return; }
      }
      const seg = db.addSegment(s.id, side, new Date().toISOString());
      setActiveSegment(seg);
      setPhase('active');
      startTimer(new Date(seg.startedAt));
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to start segment');
    } finally {
      setLoading(false);
    }
  }, [session, createSession, startTimer]);

  /** Stop the current active segment. */
  const stopSegment = useCallback(() => {
    if (!activeSegment) return;
    setLoading(true);
    try {
      const stopped = db.stopSegment(activeSegment.id, new Date().toISOString());
      // Update session to include the stopped segment
      if (session) {
        const updatedSegments = [...session.segments.filter(s => s.id !== stopped.id), stopped];
        setSession({ ...session, segments: updatedSegments });
      }
      setActiveSegment(null);
      setPhase('between');
      // Switch timer to session elapsed time
      if (session) {
        startTimer(new Date(session.startedAt));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to stop segment');
    } finally {
      setLoading(false);
    }
  }, [activeSegment, session, startTimer]);

  /** End the entire feed session. */
  const endFeed = useCallback(() => {
    if (!session) return;
    setLoading(true);
    try {
      // Stop active segment first if there is one
      const now = new Date().toISOString();
      if (activeSegment) {
        db.stopSegment(activeSegment.id, now);
      }
      db.endSession(session.id, now);
      // Reset everything
      if (timerRef.current) clearInterval(timerRef.current);
      setSession(null);
      setActiveSegment(null);
      setEvents([]);
      setElapsed(0);
      setPhase('new');
      router.navigate('/');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to end session');
    } finally {
      setLoading(false);
    }
  }, [session, activeSegment, router]);

  /** Log a quick event (burp, spill, cough). */
  const logFeedingEvent = useCallback((type: 'BURP' | 'SPILL' | 'COUGH') => {
    try {
      const ev = db.logEvent(type);
      setEvents(prev => [...prev, ev]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? `Failed to log ${type.toLowerCase()}`);
    }
  }, []);

  // Completed segments (from session, excluding active)
  const completedSegments = session?.segments.filter(
    s => s.endedAt && s.id !== activeSegment?.id
  ) ?? [];

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/' as any)}>
          <Text style={styles.backLink}>← Day overview</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>
          {phase === 'new' ? 'New Feed' : 'Active Feed'}
        </Text>
        <Text style={[styles.headerSub, { color: c.textSecondary }]}>
          {phase === 'new'
            ? 'Start by choosing a side'
            : session
              ? `Started ${fmtTime(session.startedAt)}${phase === 'between' ? ' · paused' : ''}`
              : ''}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timer */}
        <View style={styles.timerBlock}>
          <Text style={[
            styles.timer,
            {
              color: phase === 'active'
                ? '#137333'
                : phase === 'between'
                  ? (isDark ? '#666' : '#888')
                  : (isDark ? '#444' : '#ccc'),
            },
          ]}>
            {fmtTimer(elapsed)}
          </Text>
          <Text style={[styles.timerHint, { color: c.textSecondary }]}>
            {phase === 'new'
              ? 'Session timer starts on first segment'
              : activeSegment
                ? `${sideName(activeSegment.side)} · segment ${(completedSegments.length + 1)}`
                : 'No active segment'}
          </Text>

          {/* Stop segment button (only during active segment) */}
          {phase === 'active' && activeSegment && (
            <TouchableOpacity
              style={styles.stopBtn}
              onPress={stopSegment}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.stopBtnText}>
                {loading ? 'Stopping…' : 'Stop segment'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick event buttons (active or between segments) */}
        {phase !== 'new' && (
          <View style={styles.quickEvents}>
            <TouchableOpacity
              style={[styles.qeBtn, styles.qeBurp]}
              onPress={() => logFeedingEvent('BURP')}
              activeOpacity={0.7}
            >
              <Text style={styles.qeBurpText}>💨 Burp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.qeBtn, styles.qeSpill]}
              onPress={() => logFeedingEvent('SPILL')}
              activeOpacity={0.7}
            >
              <Text style={styles.qeSpillText}>💧 Spill</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.qeBtn, styles.qeCough]}
              onPress={() => logFeedingEvent('COUGH')}
              activeOpacity={0.7}
            >
              <Text style={styles.qeCoughText}>😤 Cough</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Segment buttons — shown when no active segment */}
        {(phase === 'new' || phase === 'between') && (
          <View style={{ marginTop: phase === 'new' ? 0 : 20 }}>
            {phase === 'between' && (
              <Text style={[styles.segTitle, { color: c.text }]}>Start next segment</Text>
            )}
            {phase === 'new' && (
              <Text style={[styles.segTitle, { color: c.text }]}>Start a segment</Text>
            )}

            <View style={styles.segBtns}>
              <TouchableOpacity
                style={[styles.segBtn, styles.segBtnLeft, { backgroundColor: c.cardBg }]}
                onPress={() => startSegment('LEFT')}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <>
                    <Text style={styles.segIcon}>🤱</Text>
                    <Text style={[styles.segLabel, { color: '#1967d2' }]}>Left</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segBtn, styles.segBtnRight, { backgroundColor: c.cardBg }]}
                onPress={() => startSegment('RIGHT')}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <>
                    <Text style={styles.segIcon}>🤱</Text>
                    <Text style={[styles.segLabel, { color: '#c5221f' }]}>Right</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segBtn, styles.segBtnBottle, { backgroundColor: c.cardBg }]}
                onPress={() => startSegment('BOTTLE')}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <>
                    <Text style={styles.segIcon}>🍼</Text>
                    <Text style={[styles.segLabel, { color: '#137333' }]}>Bottle</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* End feed button (only when session exists) */}
        {phase === 'between' && (
          <TouchableOpacity
            style={styles.endBtn}
            onPress={endFeed}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.endBtnText}>
              {loading ? 'Ending…' : 'End feed'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Completed segments */}
        {completedSegments.length > 0 && (
          <>
            <Text style={[styles.section, { color: c.textSecondary }]}>
              Completed segments
            </Text>
            {completedSegments.map(seg => (
              <View key={seg.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHead}>
                  <Text style={[styles.cardTime, { color: c.text }]}>{sideName(seg.side)}</Text>
                  <View style={[styles.badge, { backgroundColor: isDark ? '#3A3A3C' : '#f0f0f0' }]}>
                    <Text style={[styles.badgeText, { color: c.textSecondary }]}>
                      {durationStr(seg.startedAt, seg.endedAt)}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: c.textSecondary }}>
                  {fmtTime(seg.startedAt)} – {fmtTime(seg.endedAt!)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Events this session */}
        {events.length > 0 && (
          <>
            <Text style={[styles.section, { color: c.textSecondary }]}>
              Events this session
            </Text>
            {events.map(ev => (
              <View key={ev.id} style={[styles.evStandalone, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.evIcon, {
                  backgroundColor: ev.type === 'BURP' ? '#fff3e0'
                    : ev.type === 'SPILL' ? '#e3f2fd'
                    : '#fce4ec',
                }]}>
                  <Text style={{ fontSize: 18 }}>{eventEmoji(ev.type)}</Text>
                </View>
                <View style={styles.evInfo}>
                  <Text style={[styles.evType, { color: c.text }]}>
                    {ev.type.charAt(0) + ev.type.slice(1).toLowerCase()}
                  </Text>
                  <Text style={{ fontSize: 11, color: c.textSecondary }}>
                    {fmtTime(ev.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
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
  card: '#fafafa',
  cardBg: '#fff',
  border: '#eee',
};

const dark = {
  bg: '#1C1C1E',
  text: '#F5F5F5',
  textSecondary: '#999',
  card: '#2C2C2E',
  cardBg: '#2C2C2E',
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

  // Timer
  timerBlock: { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  timer: { fontSize: 48, fontWeight: '200', fontVariant: ['tabular-nums'] },
  timerHint: { fontSize: 13, marginTop: 4 },
  stopBtn: {
    marginTop: 12,
    backgroundColor: '#c5221f',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  stopBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Quick event buttons
  quickEvents: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  qeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  qeBurp: { backgroundColor: '#fff3e0' },
  qeSpill: { backgroundColor: '#e3f2fd' },
  qeCough: { backgroundColor: '#fce4ec' },
  qeBurpText: { fontSize: 14, fontWeight: '600', color: '#e65100' },
  qeSpillText: { fontSize: 14, fontWeight: '600', color: '#1565c0' },
  qeCoughText: { fontSize: 14, fontWeight: '600', color: '#c62828' },

  // Section
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },

  // Cards
  card: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTime: { fontWeight: '600', fontSize: 14 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  badgeText: { fontSize: 11 },

  // Standalone events
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

  // Segment buttons
  segTitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  segBtns: { flexDirection: 'row', gap: 10 },
  segBtn: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  segBtnLeft: { borderColor: '#c5dbf7' },
  segBtnRight: { borderColor: '#f5c6c2' },
  segBtnBottle: { borderColor: '#b7dfcb' },
  segIcon: { fontSize: 28, marginBottom: 6 },
  segLabel: { fontSize: 13, fontWeight: '600' },

  // End feed button
  endBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#c5221f',
    alignItems: 'center',
  },
  endBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
