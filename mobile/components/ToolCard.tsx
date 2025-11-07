import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Tool } from '../types';
import { formatPrice } from '../utils/format';

interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/tool/${tool.id}`)}
    >
      <View style={styles.imageContainer}>
        {tool.imageUrl ? (
          <Image source={{ uri: tool.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="construct" size={32} color="#CBD5E0" />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {tool.name}
        </Text>
        {tool.serialNumber && (
          <Text style={styles.serial} numberOfLines={1}>
            SN: {tool.serialNumber}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(tool.price)}</Text>
          {tool.currentUser ? (
            <View style={styles.badge}>
              <Ionicons name="person" size={12} color="#3182CE" />
              <Text style={styles.badgeText}>{tool.currentUser.name}</Text>
            </View>
          ) : tool.warehouse ? (
            <View style={styles.badge}>
              <Ionicons name="business" size={12} color="#38A169" />
              <Text style={styles.badgeText}>{tool.warehouse.name}</Text>
            </View>
          ) : null}
        </View>
        {tool.category && (
          <Text style={styles.category}>{tool.category.name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F7FAFC',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  serial: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#2D3748',
    marginLeft: 4,
  },
  category: {
    fontSize: 12,
    color: '#3182CE',
    fontWeight: '500',
  },
});
