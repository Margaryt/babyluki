/**
 * Feed screen — BabyLuki
 *
 * State machine (live mode):
 *   'new'     — no session yet. Show hero, method grid, Start Method button.
 *   'active'  — a segment is running. Show circular timer + Stop button.
 *   'between' — segment stopped, timer reset to 00:00. Show method grid,
 *               quick-log pills, and Start Method / Finish Feeding buttons.
 *
 * Past mode (phase === 'new' only):
 *   Toggle "Log Past Feed" to enter date / time / duration manually and save
 *   a completed session in one step.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Switch,
  TextInput,
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
import { C } from '@/constants/Colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtTimer(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
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
    case 'LEFT': return 'Left Breast';
    case 'RIGHT': return 'Right Breast';
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

function eventName(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

type FeedPhase = 'new' | 'active' | 'between';

const METHODS: { side: SegmentSide; label: string; icon: string }[] = [
  { side: 'LEFT', label: 'Left', icon: '🤱' },
  { side: 'RIGHT', label: 'Right', icon: '🤱' },
  { side: 'BOTTLE', label: 'Bottle', icon: '🍼' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const router = useRouter();

  // ── Live session state ──
  const [session, setSession] = useState<FeedingSessionResponse | null>(null);
  const [activeSeg, setActiveSeg] = useState<FeedingSegmentResponse | null>(null);
  const [events, setEvents] = useState<FeedingEventResponse[]>([]);
  const [phase, setPhase] = useState<FeedPhase>('new');
  const [pendingMethod, setPendingMethod] = useState<SegmentSide>('LEFT');
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Past feed state ──
  const [pastMode, setPastMode] = useState(false);
  const [pastHour, setPastHour] = useState(() => { const h = new Date().getHours() % 12; return h === 0 ? 12 : h; });
  const [pastMinute, setPastMinute] = useState(() => Math.floor(new Date().getMinutes() / 5) * 5);
  const [pastAmPm, setPastAmPm] = useState<'AM' | 'PM'>(() => new Date().getHours() < 12 ? 'AM' : 'PM');
  const [pastDuration, setPastDuration] = useState('');

  const startTimer = useCallback((from: Date) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - from.getTime()) / 1000));
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // The side that should appear selected in the method grid
  const selectedSide: SegmentSide = phase === 'active' && activeSeg ? activeSeg.side : pendingMethod;

  // ── Live actions ──

  const startSegment = useCallback((side: SegmentSide) => {
    setLoading(true);
    try {
      let s = session;
      if (!s) {
        s = db.startSession(new Date().toISOString());
        setSession(s);
      }
      const seg = db.addSegment(s.id, side, new Date().toISOString());
      setActiveSeg(seg);
      setPhase('active');
      startTimer(new Date(seg.startedAt));
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to start');
    } finally {
      setLoading(false);
    }
  }, [session, startTimer]);

  const stopSegment = useCallback(() => {
    if (!activeSeg) return;
    setLoading(true);
    try {
      const stopped = db.stopSegment(activeSeg.id, new Date().toISOString());
      setSession(prev =>
        prev
          ? { ...prev, segments: [...prev.segments.filter(x => x.id !== stopped.id), stopped] }
          : null
      );
      setActiveSeg(null);
      setPhase('between');
      // Stop and reset the timer; segment is now recorded.
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setElapsed(0);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to stop');
    } finally {
      setLoading(false);
    }
  }, [activeSeg]);

  const endFeed = useCallback(() => {
    if (!session) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      if (activeSeg) db.stopSegment(activeSeg.id, now);
      db.endSession(session.id, now);
      if (timerRef.current) clearInterval(timerRef.current);
      setSession(null);
      setActiveSeg(null);
      setEvents([]);
      setElapsed(0);
      setPhase('new');
      router.navigate('/');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to end feed');
    } finally {
      setLoading(false);
    }
  }, [session, activeSeg, router]);

  const logEvent = useCallback((type: 'BURP' | 'SPILL' | 'COUGH') => {
    try {
      const ev = db.logEvent(type);
      setEvents(prev => [...prev, ev]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to log event');
    }
  }, []);

  // Returns true if the 12-hour time + ampm is strictly in the future
  const wouldBeFuture = useCallback((h: number, m: number, ampm: 'AM' | 'PM'): boolean => {
    const hour24 = (h % 12) + (ampm === 'PM' ? 12 : 0);
    const t = new Date();
    t.setHours(hour24, m, 0, 0);
    return t > new Date();
  }, []);

  // ── Past feed action ──

  const savePastFeed = useCallback(() => {
    const mins = parseInt(pastDuration, 10);
    if (!pastDuration || isNaN(mins) || mins <= 0) {
      Alert.alert('Missing info', 'Please enter a duration greater than 0 minutes.');
      return;
    }
    setLoading(true);
    try {
      const hour24 = (pastHour % 12) + (pastAmPm === 'PM' ? 12 : 0);
      const base = new Date();
      base.setHours(hour24, pastMinute, 0, 0);
      const startedAt = base.toISOString();
      const endedAt = new Date(base.getTime() + mins * 60_000).toISOString();

      // Create session → segment → end both immediately
      const s = db.startSession(startedAt);
      const seg = db.addSegment(s.id, pendingMethod, startedAt);
      db.stopSegment(seg.id, endedAt);
      db.endSession(s.id, endedAt);

      // Reset past mode form and return home
      setPastMode(false);
      setPastDuration('');
      router.navigate('/');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save');
    } finally {
      setLoading(false);
    }
  }, [pastHour, pastMinute, pastAmPm, pastDuration, pendingMethod, router]);

  const completedSegs = session?.segments.filter(s => s.endedAt && s.id !== activeSeg?.id) ?? [];

  // ── Render ──

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.navigate('/' as any)}>
          <Text style={s.backBtnTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.brand}>BabyLuki</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.contentInner}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero / Timer area — hidden in past mode ── */}
        {!pastMode && (
          <View style={s.heroArea}>
            {phase === 'new' ? (
              <>
                <View style={s.heroIconWrap}>
                  <Image
                    source={require('@/assets/images/start_feed.png')}
                    style={s.heroImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={s.heroTitle}>Time to Feed?</Text>
                <Text style={s.heroSub}>Select a method and tap Start</Text>
              </>
            ) : (
              /* Timer ring — shown in 'active' and 'between' phases */
              <>
                <View style={s.timerRing}>
                  {phase === 'active' && (
                    <Text style={s.timerStatusLabel}>ACTIVE SESSION</Text>
                  )}
                  <Text style={s.timerDisplay}>{fmtTimer(elapsed)}</Text>
                  <Text style={s.timerMethodLabel}>
                    {activeSeg
                      ? sideName(activeSeg.side)
                      : completedSegs.length > 0
                        ? sideName(completedSegs[completedSegs.length - 1].side)
                        : ''}
                  </Text>
                </View>
                {phase === 'between' && (
                  <Text style={s.heroSub}>Select feeding method and start</Text>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Log Past Feed card — only available with no active session ── */}
        {phase === 'new' && (
          <View style={s.pastCard}>
            {/* Toggle row */}
            <View style={s.pastCardHeader}>
              <View style={s.pastCardHeaderLeft}>
                <Text style={s.pastCardIcon}>🕐</Text>
                <Text style={s.pastCardLabel}>Log Past Feed</Text>
              </View>
              <Switch
                value={pastMode}
                onValueChange={val => {
                  setPastMode(val);
                  // Reset time to now when opening
                  if (val) {
                    const now = new Date();
                    const h = now.getHours() % 12;
                    setPastHour(h === 0 ? 12 : h);
                    setPastMinute(Math.floor(now.getMinutes() / 5) * 5);
                    setPastAmPm(now.getHours() < 12 ? 'AM' : 'PM');
                    setPastDuration('');
                  }
                }}
                trackColor={{ false: C.outlineVariant + '88', true: C.primary }}
                thumbColor={C.surfaceLowest}
                ios_backgroundColor={C.outlineVariant + '88'}
              />
            </View>

            {/* Expanded fields */}
            {pastMode && (
              <View style={s.pastFields}>
                {/* Time */}
                <View style={s.pastRow}>
                  <Text style={s.pastFieldLabel}>START TIME</Text>
                  <View style={s.pastTimePicker}>
                    {/* Hours (1–12) */}
                    <View style={s.pastTimeUnit}>
                      <TouchableOpacity
                        style={s.pastStepper}
                        onPress={() => {
                          const next = pastHour === 12 ? 1 : pastHour + 1;
                          if (!wouldBeFuture(next, pastMinute, pastAmPm)) setPastHour(next);
                        }}
                      >
                        <Text style={s.pastStepperTxt}>▲</Text>
                      </TouchableOpacity>
                      <Text style={s.pastTimeValue}>{String(pastHour)}</Text>
                      <TouchableOpacity
                        style={s.pastStepper}
                        onPress={() => setPastHour(h => h === 1 ? 12 : h - 1)}
                      >
                        <Text style={s.pastStepperTxt}>▼</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.pastTimeColon}>:</Text>
                    {/* Minutes */}
                    <View style={s.pastTimeUnit}>
                      <TouchableOpacity
                        style={s.pastStepper}
                        onPress={() => {
                          const next = (pastMinute + 5) % 60;
                          if (!wouldBeFuture(pastHour, next, pastAmPm)) setPastMinute(next);
                        }}
                      >
                        <Text style={s.pastStepperTxt}>▲</Text>
                      </TouchableOpacity>
                      <Text style={s.pastTimeValue}>{String(pastMinute).padStart(2, '0')}</Text>
                      <TouchableOpacity
                        style={s.pastStepper}
                        onPress={() => setPastMinute(m => (m - 5 + 60) % 60)}
                      >
                        <Text style={s.pastStepperTxt}>▼</Text>
                      </TouchableOpacity>
                    </View>
                    {/* AM / PM toggle */}
                    <View style={s.ampmToggle}>
                      {(['AM', 'PM'] as const).map(period => {
                        const blocked = wouldBeFuture(pastHour, pastMinute, period);
                        return (
                          <TouchableOpacity
                            key={period}
                            style={[s.ampmBtn, pastAmPm === period && s.ampmBtnSel, blocked && s.ampmBtnDisabled]}
                            onPress={() => { if (!blocked) setPastAmPm(period); }}
                          >
                            <Text style={[s.ampmBtnTxt, pastAmPm === period && s.ampmBtnTxtSel, blocked && s.ampmBtnTxtDisabled]}>
                              {period}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Duration */}
                <View style={s.pastRow}>
                  <Text style={s.pastFieldLabel}>DURATION (MIN)</Text>
                  <View style={s.pastDurationRow}>
                    <TouchableOpacity
                      style={s.pastDurationBtn}
                      onPress={() => setPastDuration(d => String(Math.max(1, (parseInt(d) || 0) - 5)))}
                    >
                      <Text style={s.pastDurationBtnTxt}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={s.pastDurationInput}
                      value={pastDuration}
                      onChangeText={t => setPastDuration(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={C.outlineVariant}
                      textAlign="center"
                    />
                    <TouchableOpacity
                      style={s.pastDurationBtn}
                      onPress={() => setPastDuration(d => String((parseInt(d) || 0) + 5))}
                    >
                      <Text style={s.pastDurationBtnTxt}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Method selection grid ── */}
        <View style={s.gridSection}>
          <View style={s.grid}>
            {METHODS.map(({ side, label, icon }) => {
              const isSel = selectedSide === side;
              const isActiveSide = phase === 'active' && activeSeg?.side === side;
              return (
                <TouchableOpacity
                  key={side}
                  activeOpacity={0.7}
                  disabled={loading || phase === 'active'}
                  style={[s.gridBtn, isSel && s.gridBtnSel]}
                  onPress={() => {
                    if (phase === 'new' || phase === 'between') setPendingMethod(side);
                  }}
                >
                  <View style={[s.gridIconWrap, isSel && s.gridIconWrapSel]}>
                    <Text style={s.gridIcon}>{icon}</Text>
                  </View>
                  <Text style={[s.gridLabel, isSel && s.gridLabelSel]}>{label}</Text>
                  {isActiveSide && <View style={s.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Quick-log pills (live session only) ── */}
        {phase !== 'new' && (
          <View style={s.quickLog}>
            <TouchableOpacity style={[s.qPill, s.qPillBurp]} activeOpacity={0.7} onPress={() => logEvent('BURP')}>
              <Text style={[s.qPillTxt, s.qPillBurpTxt]}>💨 Burp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.qPill, s.qPillSpill]} activeOpacity={0.7} onPress={() => logEvent('SPILL')}>
              <Text style={[s.qPillTxt, s.qPillSpillTxt]}>💧 Spill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.qPill, s.qPillCough]} activeOpacity={0.7} onPress={() => logEvent('COUGH')}>
              <Text style={[s.qPillTxt, s.qPillCoughTxt]}>😤 Cough</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Feeding events log (live session only) ── */}
        {(completedSegs.length > 0 || events.length > 0) && (
          <View style={s.logSection}>
            <Text style={s.logHeader}>FEEDING EVENTS</Text>
            {completedSegs.map(seg => (
              <View key={seg.id} style={s.logItem}>
                <View style={[s.logDot, { backgroundColor: C.primaryContainer }]} />
                <View style={s.logBody}>
                  <Text style={s.logTitle}>{sideName(seg.side)}</Text>
                  <Text style={s.logSub}>
                    {fmtTime(seg.startedAt)} – {fmtTime(seg.endedAt!)}
                    {durationStr(seg.startedAt, seg.endedAt)
                      ? ` · ${durationStr(seg.startedAt, seg.endedAt)}`
                      : ''}
                  </Text>
                </View>
              </View>
            ))}
            {events.map(ev => (
              <View key={ev.id} style={s.logItem}>
                <View style={[s.logDot, {
                  backgroundColor:
                    ev.type === 'BURP' ? C.secondaryContainer
                    : ev.type === 'SPILL' ? C.tertiaryContainer + '88'
                    : C.errorContainer,
                }]} />
                <View style={s.logBody}>
                  <Text style={s.logTitle}>{eventEmoji(ev.type)} {eventName(ev.type)}</Text>
                  <Text style={s.logSub}>{fmtTime(ev.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Footer action buttons ── */}
      <View style={s.footer}>
        <View style={s.footerRow}>
          {pastMode ? (
            /* Past mode: single Save Past Feed button */
            <TouchableOpacity
              style={[s.footBtn, s.footBtnLeft, { flex: 1 }]}
              disabled={loading}
              activeOpacity={0.8}
              onPress={savePastFeed}
            >
              <Text style={[s.footBtnTxt, { color: C.onSecondary }]}>
                {loading ? '…' : 'Save Past Feed'}
              </Text>
            </TouchableOpacity>
          ) : phase === 'active' ? (
            /* Active: single full-width Stop button */
            <TouchableOpacity
              style={[s.footBtn, s.footBtnRight, { flex: 1 }]}
              disabled={loading}
              activeOpacity={0.8}
              onPress={stopSegment}
            >
              <Text style={[s.footBtnTxt, s.footBtnRightTxt]}>
                {loading ? '…' : 'Stop'}
              </Text>
            </TouchableOpacity>
          ) : (
            /* New / between: Start Method + Finish Feeding */
            <>
              <TouchableOpacity
                style={[s.footBtn, s.footBtnLeft]}
                disabled={loading}
                activeOpacity={0.8}
                onPress={() => startSegment(pendingMethod)}
              >
                <Text style={[s.footBtnTxt, { color: C.onSecondary }]}>
                  {loading ? '…' : 'Start Method'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.footBtn, s.footBtnRight, !session && s.footBtnDisabled]}
                disabled={!session || loading}
                activeOpacity={0.8}
                onPress={endFeed}
              >
                <Text style={[s.footBtnTxt, s.footBtnRightTxt, !session && { opacity: 0.35 }]}>
                  {loading ? '…' : 'Finish Feeding'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
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

  content: { flex: 1 },
  contentInner: { paddingBottom: 20 },

  // Hero (phase 'new') and timer ring (phases 'active' / 'between') share this container
  heroArea: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  heroIconWrap: {
    width: 180,
    height: 180,
    borderRadius: 44,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroImage: { width: 180, height: 180 },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.onSurface,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 15,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
  },

  // Circular timer ring (224×224, rounded border — no SVG required)
  timerRing: {
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 4,
    borderColor: C.primary + '2E',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceLowest,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  timerStatusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: C.outline,
    marginBottom: 4,
  },
  timerDisplay: {
    fontSize: 44,
    fontWeight: '700',
    color: C.onSurface,
    fontVariant: ['tabular-nums'],
  },
  timerMethodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: C.onSurfaceVariant,
    marginTop: 4,
  },

  // Log Past Feed card
  pastCard: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: C.surfaceLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.outlineVariant + '44',
    overflow: 'hidden',
  },
  pastCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pastCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pastCardIcon: { fontSize: 18 },
  pastCardLabel: { fontSize: 14, fontWeight: '600', color: C.onSurface },
  pastFields: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant + '33',
    paddingTop: 16,
  },
  pastRow: { gap: 8 },
  pastFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: C.outline,
  },

  // Time stepper
  pastTimePicker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pastTimeUnit: { alignItems: 'center', gap: 4 },
  pastStepper: {
    width: 40,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant + '55',
  },
  pastStepperTxt: { fontSize: 11, color: C.primary, fontWeight: '700' },
  pastTimeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: C.onSurface,
    fontVariant: ['tabular-nums'],
    width: 40,
    textAlign: 'center',
  },
  pastTimeColon: {
    fontSize: 22,
    fontWeight: '700',
    color: C.onSurfaceVariant,
    marginBottom: 4,
  },
  ampmToggle: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 8,
  },
  ampmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: C.surfaceLowest,
    borderWidth: 1.5,
    borderColor: C.outlineVariant + '66',
    alignItems: 'center',
  },
  ampmBtnSel: {
    borderColor: C.primary,
    backgroundColor: C.primary + '12',
  },
  ampmBtnTxt: { fontSize: 12, fontWeight: '700', color: C.onSurfaceVariant },
  ampmBtnTxtSel: { color: C.primary },
  ampmBtnDisabled: { opacity: 0.35 },
  ampmBtnTxtDisabled: { color: C.outline },

  // Duration input
  pastDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pastDurationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.outlineVariant + '66',
  },
  pastDurationBtnTxt: { fontSize: 20, fontWeight: '600', color: C.primary, lineHeight: 24 },
  pastDurationInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.surfaceLowest,
    borderWidth: 1.5,
    borderColor: C.outlineVariant + '66',
    fontSize: 18,
    fontWeight: '700',
    color: C.onSurface,
  },

  // Method grid
  gridSection: { paddingHorizontal: 24, marginBottom: 8 },
  grid: { flexDirection: 'row', gap: 12 },
  gridBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.outlineVariant + '66',
    backgroundColor: C.surfaceLowest,
  },
  gridBtnSel: {
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  gridIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridIconWrapSel: { backgroundColor: C.primary + '18' },
  gridIcon: { fontSize: 24 },
  gridLabel: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
  gridLabelSel: { color: C.primary },
  activeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.secondary,
  },

  // Quick-log pills
  quickLog: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginTop: 20 },
  qPill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 999 },
  qPillTxt: { fontSize: 13, fontWeight: '700' },
  qPillBurp: { backgroundColor: C.secondaryContainer },
  qPillBurpTxt: { color: C.onSecondaryContainer },
  qPillSpill: { backgroundColor: C.tertiaryContainer + '55' },
  qPillSpillTxt: { color: C.onTertiaryContainer },
  qPillCough: { backgroundColor: C.errorContainer },
  qPillCoughTxt: { color: C.onErrorContainer },

  // Events log
  logSection: { paddingHorizontal: 24, marginTop: 24 },
  logHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: C.outline,
    marginBottom: 14,
  },
  logItem: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  logDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  logBody: { flex: 1 },
  logTitle: { fontSize: 14, fontWeight: '600', color: C.onSurface },
  logSub: { fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant + '33',
    backgroundColor: C.surfaceLow + 'CC',
  },
  footerRow: { flexDirection: 'row', gap: 12 },
  footBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  footBtnLeft: { backgroundColor: C.secondary },
  footBtnRight: { backgroundColor: C.errorContainer },
  footBtnRightTxt: { color: C.onErrorContainer },
  footBtnDisabled: { backgroundColor: C.surfaceHigh },
  footBtnTxt: { fontSize: 15, fontWeight: '700' },
});
