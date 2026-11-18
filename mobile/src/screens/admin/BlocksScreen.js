import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { apiRequest } from '../../api';
import GoldButton from '../../components/GoldButton';
import Chip from '../../components/Chip';
import DayPicker from '../../components/DayPicker';
import { getNextDays, formatDateTime, describeBlock } from '../../utils/dates';
import { colors } from '../../theme';

const DAYS = getNextDays(90);

// 09:00, 09:30 ... 19:00 (same hours as the shop's opening/closing in the backend config)
const TIME_OPTIONS = [];
for (let minutes = 9 * 60; minutes <= 19 * 60; minutes += 30) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  TIME_OPTIONS.push(`${h}:${m}`);
}

export default function BlocksScreen() {
  const [barbers, setBarbers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [barberId, setBarberId] = useState(null); // null = the whole shop
  const [mode, setMode] = useState('days'); // 'days' | 'hours'
  const [startDate, setStartDate] = useState(DAYS[0].value);
  const [endDate, setEndDate] = useState(DAYS[0].value);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [barbersData, blocksData] = await Promise.all([
        apiRequest('/barbers'),
        apiRequest('/admin/blocked-slots'),
      ]);
      setBarbers(barbersData);
      setBlocks(blocksData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the range valid: the end can't be before the start
  const handleStartDate = (value) => {
    setStartDate(value);
    if (endDate < value) setEndDate(value);
  };
  const handleEndDate = (value) => {
    setEndDate(value);
    if (value < startDate) setStartDate(value);
  };

  const warnAboutAppointments = (affected) => {
    if (affected.length === 0) {
      Alert.alert('Horario bloqueado', 'Nadie podrá reservar en ese horario.');
      return;
    }
    const lines = affected
      .slice(0, 5)
      .map((a) => `• ${formatDateTime(a.startsAt)} — ${a.client.name} (${a.barber.name})`)
      .join('\n');
    const more = affected.length > 5 ? `\ny ${affected.length - 5} más` : '';
    const count = affected.length === 1 ? 'Hay 1 turno reservado' : `Hay ${affected.length} turnos reservados`;

    Alert.alert(
      'Horario bloqueado',
      `${count} dentro de este bloqueo y siguen activos. Avisa a los clientes o cancélalos:\n\n${lines}${more}`
    );
  };

  const handleSubmit = async () => {
    setError('');
    const isHours = mode === 'hours';

    if (isHours && endTime <= startTime) {
      setError('La hora de fin debe ser posterior a la de inicio');
      return;
    }

    setSaving(true);
    try {
      const result = await apiRequest('/admin/blocked-slots', {
        method: 'POST',
        body: {
          barberId,
          startDate,
          endDate: isHours ? startDate : endDate,
          ...(isHours && { startTime, endTime }),
          reason: reason.trim() || undefined,
        },
      });
      setReason('');
      await load();
      warnAboutAppointments(result.affectedAppointments);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = async (id) => {
    try {
      await apiRequest(`/admin/blocked-slots/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      Alert.alert('No se pudo quitar el bloqueo', e.message);
    }
  };

  const confirmRemove = (block) => {
    Alert.alert('Quitar bloqueo', `${describeBlock(block)}\n\nEsos horarios volverán a estar disponibles.`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, quitar', style: 'destructive', onPress: () => removeBlock(block.id) },
    ]);
  };

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={styles.center} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Bloquear horarios</Text>

      <Text style={styles.label}>¿A quién afecta?</Text>
      <View style={styles.row}>
        <Chip label="Toda la barbería" selected={barberId === null} onPress={() => setBarberId(null)} />
        {barbers.map((b) => (
          <Chip key={b.id} label={b.name} selected={barberId === b.id} onPress={() => setBarberId(b.id)} />
        ))}
      </View>

      <Text style={styles.label}>¿Qué quieres bloquear?</Text>
      <View style={styles.row}>
        <Chip label="Días completos" selected={mode === 'days'} onPress={() => setMode('days')} />
        <Chip label="Algunas horas" selected={mode === 'hours'} onPress={() => setMode('hours')} />
      </View>

      {mode === 'days' ? (
        <>
          <Text style={styles.label}>Desde</Text>
          <DayPicker days={DAYS} value={startDate} onChange={handleStartDate} />
          <Text style={styles.label}>Hasta (incluido)</Text>
          <DayPicker days={DAYS} value={endDate} onChange={handleEndDate} />
        </>
      ) : (
        <>
          <Text style={styles.label}>Día</Text>
          <DayPicker days={DAYS} value={startDate} onChange={setStartDate} />
          <Text style={styles.label}>Desde las</Text>
          <View style={styles.row}>
            {TIME_OPTIONS.slice(0, -1).map((t) => (
              <Chip key={t} label={t} selected={startTime === t} onPress={() => setStartTime(t)} />
            ))}
          </View>
          <Text style={styles.label}>Hasta las</Text>
          <View style={styles.row}>
            {TIME_OPTIONS.slice(1).map((t) => (
              <Chip key={t} label={t} selected={endTime === t} onPress={() => setEndTime(t)} />
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Motivo (opcional)</Text>
      <TextInput
        style={styles.input} placeholder="Vacaciones, almuerzo, feriado..."
        placeholderTextColor={colors.muted} value={reason} onChangeText={setReason}
      />

      {error !== '' && <Text style={styles.error}>{error}</Text>}
      <GoldButton title="Bloquear" onPress={handleSubmit} loading={saving} />

      <Text style={[styles.title, styles.listTitle]}>Bloqueos activos</Text>
      {blocks.length === 0 && <Text style={styles.muted}>No hay bloqueos programados.</Text>}

      {blocks.map((block) => (
        <View key={block.id} style={styles.card}>
          <View style={styles.info}>
            <Text style={styles.when}>{describeBlock(block)}</Text>
            <Text style={styles.who}>{block.barber ? block.barber.name : 'Toda la barbería'}</Text>
            {block.reason ? <Text style={styles.reason}>{block.reason}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => confirmRemove(block)}>
            <Text style={styles.remove}>Quitar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  listTitle: { marginTop: 32, marginBottom: 12 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 10, color: colors.text, padding: 14, fontSize: 16, marginBottom: 16,
  },
  error: { color: colors.error, marginBottom: 12, textAlign: 'center' },
  muted: { color: colors.muted },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderLeftWidth: 3, borderLeftColor: colors.gold, borderRadius: 10, padding: 14, marginBottom: 10,
  },
  info: { flex: 1 },
  when: { color: colors.text, fontWeight: '600', fontSize: 15, textTransform: 'capitalize' },
  who: { color: colors.goldLight, marginTop: 3, fontSize: 14 },
  reason: { color: colors.muted, marginTop: 2, fontSize: 13 },
  remove: { color: colors.error, fontSize: 14 },
});