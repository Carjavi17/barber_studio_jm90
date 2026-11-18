import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { apiRequest } from '../../api';
import AppointmentCard from '../../components/AppointmentCard';
import Chip from '../../components/Chip';
import { groupByDay } from '../../utils/appointments';
import { formatDateTime } from '../../utils/dates';
import { colors } from '../../theme';

export default function AdminAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('upcoming'); // 'upcoming' | 'history'
  const [barberId, setBarberId] = useState(null); // null = all barbers

  const load = useCallback(async () => {
    try {
      setError('');
      setAppointments(await apiRequest('/appointments'));
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

  // Barbers that appear in the appointments (this includes deactivated ones)
  const barbers = useMemo(() => {
    const byId = new Map();
    appointments.forEach((a) => byId.set(a.barber.id, a.barber.name));
    return [...byId]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  const sections = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const isUpcoming = (a) => a.status !== 'cancelled' && new Date(a.startsAt) >= startOfToday;

    const visible = appointments.filter(
      (a) =>
        (barberId === null || a.barber.id === barberId) &&
        (view === 'upcoming' ? isUpcoming(a) : !isUpcoming(a))
    );

    // The API sorts oldest first; the history reads better with the newest on top
    return groupByDay(view === 'upcoming' ? visible : [...visible].reverse());
  }, [appointments, view, barberId]);

  const total = sections.reduce((count, section) => count + section.data.length, 0);

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
      `¿Cancelar el turno de ${appointment.client.name} con ${appointment.barber.name}?\n${formatDateTime(appointment.startsAt)}`,
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
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Turnos</Text>

          <View style={styles.row}>
            <Chip label="Próximos" selected={view === 'upcoming'} onPress={() => setView('upcoming')} />
            <Chip label="Historial" selected={view === 'history'} onPress={() => setView('history')} />
          </View>

          {barbers.length > 0 && (
            <View style={[styles.row, styles.filters]}>
              <Chip label="Todos" selected={barberId === null} onPress={() => setBarberId(null)} />
              {barbers.map((b) => (
                <Chip key={b.id} label={b.name} selected={barberId === b.id} onPress={() => setBarberId(b.id)} />
              ))}
            </View>
          )}

          <Text style={styles.count}>
            {total === 1 ? '1 turno' : `${total} turnos`}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {error || (view === 'upcoming' ? 'No hay turnos próximos.' : 'Todavía no hay historial.')}
        </Text>
      }
      renderSectionHeader={({ section }) => <Text style={styles.day}>{section.title}</Text>}
      renderItem={({ item }) => (
        <AppointmentCard
          appointment={item}
          showBarber
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
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filters: { marginTop: 10 },
  count: { color: colors.muted, marginTop: 14, fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  day: {
    color: colors.gold, fontSize: 15, fontWeight: '700', textTransform: 'capitalize',
    marginTop: 18, marginBottom: 10,
  },
});