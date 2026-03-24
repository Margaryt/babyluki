/**
 * Bottom sheet overlay for the "Add event" button.
 * Currently only shows the Feed option. More event types will be added later.
 */
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  useColorScheme,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onFeed: () => void;
}

export default function AddEventSheet({ visible, onClose, onFeed }: Props) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <View />
      </Pressable>

      {/* Panel */}
      <View style={[styles.panel, isDark && styles.panelDark]}>
        <View style={[styles.handle, isDark && styles.handleDark]} />
        <Text style={[styles.title, isDark && { color: '#F5F5F5' }]}>
          Add event
        </Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.item, { backgroundColor: '#e6f4ea' }]}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              onFeed();
            }}
          >
            <Text style={styles.icon}>🍼</Text>
            <Text style={[styles.label, { color: '#137333' }]}>Feed</Text>
            <Text style={[styles.hint, { color: '#137333' }]}>
              Start session
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  panelDark: {
    backgroundColor: '#2C2C2E',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  handleDark: {
    backgroundColor: '#555',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    width: 100,
  },
  icon: {
    fontSize: 28,
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
    fontSize: 13,
  },
  hint: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
});
