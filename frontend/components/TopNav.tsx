import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { label: 'Day', path: '/' },
  { label: 'Feed', path: '/feed' },
  { label: 'Stats', path: '/stats' },
];

/**
 * Shared top navigation bar matching the mockup's tab switcher.
 * Dark pill-style active state: dark bg + white text.
 */
export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.row}>
      {TABS.map((tab) => {
        const isActive =
          tab.path === '/' ? pathname === '/' || pathname === '/index' : pathname === tab.path;

        return (
          <TouchableOpacity
            key={tab.path}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => router.replace(tab.path as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingVertical: 10 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: '#1a1a1a' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#888' },
  tabTextActive: { fontSize: 13, fontWeight: '500', color: '#fff' },
});
