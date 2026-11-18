import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Logo from './Logo';
import { colors } from '../theme';

export default function AppHeader({ onLogout }) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Logo size={44} />
        <Text style={styles.name}>Barber Studio</Text>
      </View>
      <TouchableOpacity onPress={onLogout}>
        <Text style={styles.logout}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.gold, backgroundColor: 'rgba(20, 20, 20, 0.92)',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: colors.gold, fontSize: 16, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  logout: { color: colors.goldLight, fontSize: 15 },
});