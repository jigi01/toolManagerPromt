import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function FloatingActionButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/scanner')}
      activeOpacity={0.8}
    >
      <Ionicons name="qr-code-outline" size={32} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3182CE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3182CE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
});
