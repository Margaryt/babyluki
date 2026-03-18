import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNav from '@/components/TopNav';

/**
 * Statistics screen — Screen 6 from the mockup.
 * Shows period selector, feeding heatmap, and averages.
 * Will be wired up to the API in step 7.
 */

const MOCK_STATS = {
  feeding: [
    { label: 'Feeds per day', value: '6.2' },
    { label: 'Avg session', value: '18.4 min' },
    { label: 'Avg gap between feeds', value: '2h 22m' },
    { label: 'Daily bottle intake', value: '240 ml' },
  ],
  events: [
    { label: 'Burps per feed', value: '1.3' },
    { label: 'Spills per day', value: '1.8' },
    { label: 'Spills linked to feeds', value: '72%' },
    { label: 'Coughs per day', value: '2.1' },
    { label: 'Hiccup episodes / day', value: '0.7' },
    { label: 'Avg hiccup duration', value: '6 min' },
  ],
  sleepNappies: [
    { label: 'Total sleep / day', value: '14.2 h' },
    { label: 'Longest stretch', value: '4h 10m' },
    { label: 'Nappies per day', value: '6.4' },
    { label: 'Wet / dirty ratio', value: '3:2' },
  ],
};

// Simple heatmap data — 7 rows (days), 24 cols (hours), values 0-3
const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP_DATA = [
  [0,0,0,0,0,1,2,0,0,1,2,0,0,1,3,0,0,1,2,0,0,1,0,0],
  [0,0,1,0,0,2,3,0,0,2,1,0,0,2,2,0,0,1,3,0,0,0,1,0],
  [0,0,0,1,0,1,3,0,0,1,2,0,0,3,1,0,0,2,2,0,0,1,0,0],
  [0,0,0,0,0,2,2,0,1,2,1,0,0,1,3,0,0,2,1,0,0,0,1,0],
  [0,0,1,0,0,3,2,0,0,1,3,0,1,2,1,0,0,1,2,0,0,1,0,0],
  [0,0,0,0,0,2,3,0,0,2,2,0,0,1,2,0,0,3,1,0,0,0,1,0],
  [0,1,0,0,0,1,2,0,0,3,1,0,0,2,3,0,0,1,2,0,1,0,0,0],
];

const HM_COLORS = ['#f5f5f5', '#c8e6c9', '#81c784', '#43a047'];
const HM_COLORS_DARK = ['#2C2C2E', '#2e5e2e', '#3a7a3a', '#43a047'];

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = isDark ? dark : light;
  const hmColors = isDark ? HM_COLORS_DARK : HM_COLORS;

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

        {/* Period selector */}
        <View style={styles.periodRow}>
          <View style={[styles.periodTab, { backgroundColor: isDark ? '#3A3A3C' : '#f0f0f0' }]}>
            <Text style={[styles.periodTextActive, { color: c.text }]}>7 days</Text>
          </View>
          <TouchableOpacity style={styles.periodTab}>
            <Text style={[styles.periodText, { color: c.textSecondary }]}>14 days</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.periodTab}>
            <Text style={[styles.periodText, { color: c.textSecondary }]}>30 days</Text>
          </TouchableOpacity>
        </View>

        {/* Heatmap */}
        <View style={[styles.graphBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.graphTitle, { color: c.textSecondary }]}>Feeding windows</Text>
          {HEATMAP_DAYS.map((day, rowIdx) => (
            <View key={day} style={styles.hmRow}>
              <Text style={[styles.hmLabel, { color: c.textSecondary }]}>{day}</Text>
              <View style={styles.hmCells}>
                {HEATMAP_DATA[rowIdx].map((val, colIdx) => (
                  <View
                    key={colIdx}
                    style={[styles.hmCell, { backgroundColor: hmColors[val] }]}
                  />
                ))}
              </View>
            </View>
          ))}
          {/* Hour axis */}
          <View style={styles.hmAxis}>
            {[0,3,6,9,12,15,18,21].map((h) => (
              <Text key={h} style={[styles.hmAxisLabel, { color: c.textSecondary }]}>{h}</Text>
            ))}
          </View>
        </View>

        {/* Feeding stats */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Feeding</Text>
        {MOCK_STATS.feeding.map((s, i) => (
          <View key={i} style={[styles.statRow, { borderBottomColor: c.border }, i === MOCK_STATS.feeding.length - 1 && styles.statRowLast]}>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>{s.label}</Text>
            <Text style={[styles.statValue, { color: c.text }]}>{s.value}</Text>
          </View>
        ))}

        {/* Events stats */}
        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 18 }]}>Events</Text>
        {MOCK_STATS.events.map((s, i) => (
          <View key={i} style={[styles.statRow, { borderBottomColor: c.border }, i === MOCK_STATS.events.length - 1 && styles.statRowLast]}>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>{s.label}</Text>
            <Text style={[styles.statValue, { color: c.text }]}>{s.value}</Text>
          </View>
        ))}

        {/* Sleep & Nappies */}
        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 18 }]}>Sleep & Nappies</Text>
        {MOCK_STATS.sleepNappies.map((s, i) => (
          <View key={i} style={[styles.statRow, { borderBottomColor: c.border }, i === MOCK_STATS.sleepNappies.length - 1 && styles.statRowLast]}>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>{s.label}</Text>
            <Text style={[styles.statValue, { color: c.text }]}>{s.value}</Text>
          </View>
        ))}

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

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },

  content: { flex: 1, paddingHorizontal: 16 },

  // Period selector
  periodRow: { flexDirection: 'row', gap: 4, paddingBottom: 10 },
  periodTab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  periodText: { fontSize: 12, fontWeight: '500' },
  periodTextActive: { fontSize: 12, fontWeight: '500' },

  // Heatmap
  graphBox: {
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
  },
  graphTitle: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  hmRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  hmLabel: { width: 32, fontSize: 9 },
  hmCells: { flex: 1, flexDirection: 'row', gap: 1 },
  hmCell: { flex: 1, height: 14, borderRadius: 2 },
  hmAxis: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 32, marginTop: 4 },
  hmAxisLabel: { fontSize: 8 },

  // Stat rows
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statRowLast: { borderBottomWidth: 0 },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 13, fontWeight: '600' },

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
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
