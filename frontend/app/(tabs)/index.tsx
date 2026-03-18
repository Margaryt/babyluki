import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNav from '@/components/TopNav';

// ---------------------------------------------------------------------------
// Mock data — will be replaced with API calls in step 4
// ---------------------------------------------------------------------------
const MOCK_PILLS = [
  { emoji: '🍼', value: '6', label: 'feeds' },
  { emoji: '💨', value: '4', label: 'burps' },
  { emoji: '💧', value: '2', label: 'spills' },
  { emoji: '😤', value: '3', label: 'coughs' },
  { emoji: '🫢', value: '1', label: 'hiccup' },
  { emoji: '😴', value: '3h 20m', label: '' },
  { emoji: '🧷', value: '5', label: 'nappies' },
];

const MOCK_SESSIONS = [
  {
    id: '1',
    time: '08:15 – 08:42',
    duration: '27 min',
    segments: [
      { label: 'L 12m', type: 'left' as const },
      { label: 'R 10m', type: 'right' as const },
    ],
    events: [
      { emoji: '💨', time: '08:30', type: 'burp' as const },
      { emoji: '💨', time: '08:41', type: 'burp' as const },
      { emoji: '💧', time: '08:44', type: 'spill' as const },
    ],
  },
  {
    id: '2',
    time: '11:00 – 11:25',
    duration: '25 min',
    segments: [{ label: '🍼 120ml', type: 'bottle' as const }],
    events: [
      { emoji: '💨', time: '11:15', type: 'burp' as const },
      { emoji: '😤', time: '11:18', type: 'cough' as const },
      { emoji: '💧', time: '11:28', type: 'spill' as const },
    ],
  },
  {
    id: '3',
    time: '14:10 – 14:35',
    duration: '25 min',
    segments: [
      { label: 'L 15m', type: 'left' as const },
      { label: 'R 8m', type: 'right' as const },
    ],
    events: [{ emoji: '💨', time: '14:34', type: 'burp' as const }],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DayScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = isDark ? dark : light;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{dateStr}</Text>
        <Text style={[styles.headerSub, { color: c.textSecondary }]}>Luki — 8 weeks old</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top navigation */}
        <TopNav />

        {/* Summary pills */}
        <View style={styles.pillRow}>
          {MOCK_PILLS.map((p, i) => (
            <View key={i} style={[styles.pill, { backgroundColor: c.card }]}>
              <Text style={styles.pillEmoji}>{p.emoji}</Text>
              <Text style={[styles.pillValue, { color: c.text }]}>{p.value}</Text>
              {p.label ? <Text style={[styles.pillLabel, { color: c.textSecondary }]}>{p.label}</Text> : null}
            </View>
          ))}
        </View>

        {/* AI Summary card */}
        <View style={[styles.aiCard, isDark && styles.aiCardDark]}>
          <Text style={styles.aiBadge}>✨ AI Summary</Text>
          <Text style={[styles.aiText, { color: isDark ? '#ddd' : '#333' }]}>
            Luki had a solid day — 6 feeds averaging 22 min each, mostly breast. Spills only after
            bottle feeds. On track with yesterday's routine.
          </Text>
          <TouchableOpacity>
            <Text style={styles.aiReadMore}>Read more →</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Feeds */}
        <Text style={[styles.section, { color: c.textSecondary }]}>Feeds</Text>

        {MOCK_SESSIONS.map((s) => (
          <View key={s.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTime, { color: c.text }]}>{s.time}</Text>
              <View style={[styles.badge, { backgroundColor: isDark ? '#3A3A3C' : '#f0f0f0' }]}>
                <Text style={[styles.badgeText, { color: c.textSecondary }]}>{s.duration}</Text>
              </View>
            </View>

            {/* Segment tags */}
            <View style={styles.tagRow}>
              {s.segments.map((seg, i) => (
                <View key={i} style={[styles.tag, tagStyles[seg.type]]}>
                  <Text style={[styles.tagText, tagTextStyles[seg.type]]}>{seg.label}</Text>
                </View>
              ))}
            </View>

            {/* Event chips */}
            {s.events.length > 0 && (
              <View style={[styles.eventRow, { borderTopColor: c.border }]}>
                {s.events.map((ev, i) => (
                  <View key={i} style={[styles.tag, tagStyles[ev.type]]}>
                    <Text style={[styles.tagText, tagTextStyles[ev.type]]}>
                      {ev.emoji} {ev.time}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Bottom spacing for add-event bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add event button */}
      <View style={[styles.addBar, { backgroundColor: c.bg, borderTopColor: c.border }]}>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>＋ Add event</Text>
        </TouchableOpacity>
      </View>
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
  aiCardDark: {
    backgroundColor: '#1a2a3a',
    borderColor: '#2a4a6a',
  },
  aiBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1967d2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  aiText: { fontSize: 13, lineHeight: 19 },
  aiReadMore: { fontSize: 12, fontWeight: '600', color: '#1967d2', marginTop: 8 },

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
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
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
