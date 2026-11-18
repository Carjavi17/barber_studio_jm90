import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { apiRequest } from '../../api';
import Chip from '../../components/Chip';
import DayPicker from '../../components/DayPicker';
import { getNextDays, formatTime, formatDateTime } from '../../utils/dates';
import { formatPrice, formatDuration } from '../../utils/format';
import { colors } from '../../theme';

const DAYS = getNextDays(14);

export default function BookScreen() {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [serviceId, setServiceId] = useState(null);
  const [barberId, setBarberId] = useState(null);
  const [date, setDate] = useState(DAYS[0].value);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');

  // Services and barbers load once, when the screen opens
  useEffect(() => {
    Promise.all([apiRequest('/services'), apiRequest('/barbers')])
      .then(([servicesData, barbersData]) => {
        setServices(servicesData);
        setBarbers(barbersData);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Free slots reload when the service, barber or day changes (or after booking)
  useEffect(() => {
    if (!barberId || !serviceId) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);

    apiRequest(`/barbers/${barberId}/slots?date=${date}&serviceId=${serviceId}`)
      .then((data) => {
        if (cancelled) return;
        setSlots(data);
        setError('');
      })
      .catch((e) => {
        if (cancelled) return;
        setSlots([]);
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => { cancelled = true; };
  }, [barberId, serviceId, date, refreshKey]);

  const book = async (startsAt) => {
    try {
      await apiRequest('/appointments', { method: 'POST', body: { barberId, serviceId, startsAt } });
      Alert.alert('¡Turno reservado!', `Te esperamos el ${formatDateTime(startsAt)}.`);
    } catch (e) {
      Alert.alert('No se pudo reservar', e.message);
    }
    setRefreshKey((k) => k + 1); // reload slots either way
  };

  const confirmBooking = (startsAt) => {
    const service = services.find((s) => s.id === serviceId);
    const barber = barbers.find((b) => b.id === barberId);

    Alert.alert(
      'Confirmar turno',
      `${service.name} (${formatDuration(service.durationMinutes)})\n${formatPrice(service.price)}\nCon ${barber.name}\n${formatDateTime(startsAt)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reservar', onPress: () => book(startsAt) },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Elige el servicio</Text>
      {services.length === 0 && <Text style={styles.muted}>Todavía no hay servicios disponibles.</Text>}
      {services.map((service) => {
        const selected = serviceId === service.id;
        return (
          <TouchableOpacity
            key={service.id}
            style={[styles.serviceCard, selected && styles.serviceCardSelected]}
            onPress={() => setServiceId(service.id)}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDuration}>{formatDuration(service.durationMinutes)}</Text>
            </View>
            <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
          </TouchableOpacity>
        );
      })}

      <Text style={styles.heading}>Elige tu barbero</Text>
      <View style={styles.row}>
        {barbers.map((barber) => (
          <Chip
            key={barber.id}
            label={barber.name}
            selected={barberId === barber.id}
            onPress={() => setBarberId(barber.id)}
          />
        ))}
        {barbers.length === 0 && <Text style={styles.muted}>No hay barberos disponibles.</Text>}
      </View>

      <Text style={styles.heading}>Elige el día</Text>
      <DayPicker days={DAYS} value={date} onChange={setDate} />

      <Text style={styles.heading}>Horarios disponibles</Text>
      {(!serviceId || !barberId) && (
        <Text style={styles.muted}>Elige un servicio y un barbero para ver los horarios.</Text>
      )}
      {serviceId && barberId && loadingSlots && <ActivityIndicator color={colors.gold} />}
      {serviceId && barberId && !loadingSlots && slots.length === 0 && !error && (
        <Text style={styles.muted}>No hay horarios disponibles ese día.</Text>
      )}
      {error !== '' && <Text style={styles.error}>{error}</Text>}

      <View style={styles.row}>
        {!loadingSlots && slots.map((slot) => (
          <Chip key={slot} label={formatTime(slot)} onPress={() => confirmBooking(slot)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  heading: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 22, marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muted: { color: colors.muted },
  error: { color: colors.error, marginBottom: 8 },
  serviceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 10, padding: 14, marginBottom: 8,
  },
  serviceCardSelected: { borderColor: colors.gold },
  serviceInfo: { flex: 1, marginRight: 12 },
  serviceName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  serviceDuration: { color: colors.muted, marginTop: 2, fontSize: 13 },
  servicePrice: { color: colors.gold, fontSize: 16, fontWeight: '700' },
});