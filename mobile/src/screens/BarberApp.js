import { View, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader';
import AgendaScreen from './barber/AgendaScreen';
import { colors } from '../theme';

export default function BarberApp({ onLogout }) {
  return (
    <View style={styles.container}>
      <AppHeader onLogout={onLogout} />
      <AgendaScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});