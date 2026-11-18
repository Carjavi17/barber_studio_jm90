import { useCallback, useEffect, useState } from 'react';
import { Text, SectionList, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { apiRequest } from '../../api';
import AppointmentCard from '../../components/AppointmentCard';
import { groupByDay } from '../../utils/appointments';
import { formatTime } from '../../utils/dates';
import { colors } from '../../theme';

export default function AgendaScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await apiRequest('/appointments');

      // Keep today's and upcoming appointments, hide cancelled ones
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      setAppointments(
        data.filter((a) => a.status !== 'cancelled' && new Date(a.startsAt) >= startOfToday)
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateAppointment = async (id, action) => {
    try {
      await apiRequest(`/appointments/${id}/${action}`, { method: 'PATCH' });
      await load();
    } catch (e) {
      Alert.alert('No se pudo actualizar el turno', e.message);
    }
  };

  const confirmCancel = (appointment) => {
    Alert.alert(
      'Cancelar turno',
      `¿Cancelar el turno de ${appointment.client.name} a las ${formatTime(appointment.startsAt)}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => updateAppointment(appointment.id, 'cancel') },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={styles.center} />;
  }

  return (
    <SectionList
      sections={groupByDay(appointments)}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      ListHeaderComponent={<Text style={styles.title}>Mi agenda</Text>}
      ListEmptyComponent={<Text style={styles.empty}>{error || 'No tienes turnos próximos.'}</Text>}
      renderSectionHeader={({ section }) => <Text style={styles.day}>{section.title}</Text>}
      renderItem={({ item }) => (
        <AppointmentCard
          appointment={item}
          onConfirm={(a) => updateAppointment(a.id, 'confirm')}
          onCancel={confirmCancel}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  list: { padding: 16, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  day: {
    color: colors.gold, fontSize: 15, fontWeight: '700', textTransform: 'capitalize',
    marginTop: 20, marginBottom: 10,
  },
});