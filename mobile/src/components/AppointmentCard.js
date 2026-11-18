import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { formatTime } from '../utils/dates';
import { colors } from '../theme';
import { formatPrice } from '../utils/format';

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

export default function AppointmentCard({ appointment, showBarber = false, onConfirm, onCancel }) {
  const { client, barber, startsAt, status } = appointment;
  const isCancelled = status === 'cancelled';
  const isUpcoming = new Date(startsAt) > new Date();
  const minutes = Math.round((new Date(appointment.endsAt) - new Date(startsAt)) / 60000);

  return (
    <View style={[styles.card, isCancelled && styles.cardCancelled]}>
      <Text style={styles.time}>{formatTime(startsAt)}</Text>

      <View style={styles.info}>
        <Text style={styles.client}>{client.name}</Text>
        <Text style={styles.service}>
          {appointment.serviceName} · {minutes} min · {formatPrice(appointment.price)}
        </Text>
        {showBarber && <Text style={styles.barber}>Con {barber.name}</Text>}
        {client.phone ? (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${client.phone}`)}>
            <Text style={styles.phone}>{client.phone}</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.status, isCancelled && styles.statusCancelled]}>
          {STATUS_LABELS[status]}
        </Text>
      </View>

      <View style={styles.actions}>
        {status === 'pending' && isUpcoming && onConfirm && (
          <TouchableOpacity onPress={() => onConfirm(appointment)}>
            <Text style={styles.confirm}>Confirmar</Text>
          </TouchableOpacity>
        )}
        {!isCancelled && isUpcoming && onCancel && (
          <TouchableOpacity onPress={() => onCancel(appointment)}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderLeftWidth: 3, borderLeftColor: colors.gold, borderRadius: 10, padding: 14, marginBottom: 10,
  },
  cardCancelled: { borderLeftColor: colors.border, opacity: 0.6 },
  time: { color: colors.text, fontSize: 20, fontWeight: '700', width: 64 },
  info: { flex: 1 },
  client: { color: colors.text, fontWeight: '600', fontSize: 15 },
  barber: { color: colors.goldLight, marginTop: 2, fontSize: 14 },
  phone: { color: colors.goldLight, marginTop: 2 },
  status: { color: colors.muted, marginTop: 4, fontSize: 13 },
  statusCancelled: { color: colors.muted },
  actions: { alignItems: 'flex-end', gap: 10 },
  confirm: { color: colors.gold, fontWeight: '700', fontSize: 14 },
  cancel: { color: colors.error, fontSize: 14 },
  service: { color: colors.text, marginTop: 2, fontSize: 14 },
});