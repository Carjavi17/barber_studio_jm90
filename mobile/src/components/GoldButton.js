import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function GoldButton({ title, onPress, loading = false }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color={colors.black} /> : <Text style={styles.label}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  label: { color: colors.black, fontSize: 16, fontWeight: '700' },
});