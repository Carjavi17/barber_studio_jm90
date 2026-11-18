import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { apiRequest } from '../../api';
import { formatDateTime } from '../../utils/dates';
import { colors } from '../../theme';
import { formatPrice } from '../../utils/format';

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

export default function MyAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setAppointments(await apiRequest('/appointments'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id) => {
    try {
      await apiRequest(`/appointments/${id}/cancel`, { method: 'PATCH' });
      await load();
    } catch (e) {
      Alert.alert('No se pudo cancelar', e.message);
    }
  };

  const confirmCancel = (appointment) => {
    Alert.alert('Cancelar turno', '¿Seguro que quieres cancelar este turno?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancel(appointment.id) },
    ]);
  };

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={styles.center} />;
  }

  return (
    <FlatList
      data={appointments}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {error || 'Todavía no tienes turnos. ¡Reserva el primero!'}
        </Text>
      }
      renderItem={({ item }) => {
        const isCancelled = item.status === 'cancelled';
        const canCancel = !isCancelled && new Date(item.startsAt) > new Date();

        return (
          <View style={[styles.card, isCancelled && styles.cardCancelled]}>
            <View style={styles.info}>
              <Text style={styles.date}>{formatDateTime(item.startsAt)}</Text>
              <Text style={styles.service}>{item.serviceName} · {formatPrice(item.price)}</Text>
              <Text style={styles.barber}>Con {item.barber.name}</Text>
              <Text style={[styles.status, isCancelled && styles.statusCancelled]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
            {canCancel && (
              <TouchableOpacity onPress={() => confirmCancel(item)}>
                <Text style={styles.cancel}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  list: { padding: 16 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderLeftWidth: 3, borderLeftColor: colors.gold, borderRadius: 10, padding: 14, marginBottom: 10,
  },
  cardCancelled: { borderLeftColor: colors.border, opacity: 0.6 },
  info: { flex: 1 },
  date: { color: colors.text, fontWeight: '600', fontSize: 15, textTransform: 'capitalize' },
  barber: { color: colors.muted, marginTop: 2 },
  status: { color: colors.goldLight, marginTop: 6, fontSize: 13 },
  statusCancelled: { color: colors.muted },
  cancel: { color: colors.error, fontSize: 14 },
  service: { color: colors.goldLight, marginTop: 4, fontSize: 14 },
});