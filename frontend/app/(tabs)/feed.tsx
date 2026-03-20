import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Feed screen — Screen 4 from the mockup (New Feed).
 * Shows the timer and segment selection buttons.
 * Will be wired up to the API in a future PR.
 */
export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = isDark ? dark : light;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>New Feed</Text>
        <Text style={[styles.headerSub, { color: c.textSecondary }]}>Start by choosing a side</Text>
      </View>

      <View style={styles.content}>
        {/* Timer */}
        <View style={styles.timerBlock}>
          <Text style={[styles.timer, { color: isDark ? '#555' : '#ccc' }]}>00:00</Text>
          <Text style={[styles.timerHint, { color: c.textSecondary }]}>
            Session timer starts on first segment
          </Text>
        </View>

        {/* Start a segment */}
        <Text style={[styles.segTitle, { color: c.text }]}>Start a segment</Text>

        <View style={styles.segBtns}>
          <TouchableOpacity style={[styles.segBtn, styles.segBtnLeft, { backgroundColor: c.cardBg }]}>
            <Text style={styles.segIcon}>🤱</Text>
            <Text style={[styles.segLabel, { color: '#1967d2' }]}>Left</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.segBtn, styles.segBtnRight, { backgroundColor: c.cardBg }]}>
            <Text style={styles.segIcon}>🤱</Text>
            <Text style={[styles.segLabel, { color: '#c5221f' }]}>Right</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.segBtn, styles.segBtnBottle, { backgroundColor: c.cardBg }]}>
            <Text style={styles.segIcon}>🍼</Text>
            <Text style={[styles.segLabel, { color: '#137333' }]}>Bottle</Text>
          </TouchableOpacity>
        </View>
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
  cardBg: '#fff',
};

const dark = {
  bg: '#1C1C1E',
  text: '#F5F5F5',
  textSecondary: '#999',
  cardBg: '#2C2C2E',
};

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 40 },

  // Timer
  timerBlock: { alignItems: 'center', marginBottom: 32 },
  timer: { fontSize: 48, fontWeight: '200', fontVariant: ['tabular-nums'] },
  timerHint: { fontSize: 13, marginTop: 6 },

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
  },
  segBtnLeft: { borderColor: '#c5dbf7' },
  segBtnRight: { borderColor: '#f5c6c2' },
  segBtnBottle: { borderColor: '#b7dfcb' },
  segIcon: { fontSize: 28, marginBottom: 6 },
  segLabel: { fontSize: 13, fontWeight: '600' },
});
