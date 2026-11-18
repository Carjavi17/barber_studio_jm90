import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import GoldButton from '../../components/GoldButton';
import Chip from '../../components/Chip';
import { apiRequest } from '../../api';
import { formatPrice, formatDuration } from '../../utils/format';
import { colors } from '../../theme';

const DURATIONS = [30, 60, 90, 120];

// service === null means "create a new one"
export default function ServiceModal({ visible, service, onClose, onSaved }) {
  const isEditing = service !== null;

  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fill the form each time the modal opens
  useEffect(() => {
    if (!visible) return;
    setName(service ? service.name : '');
    setDuration(service ? service.durationMinutes : 30);
    setPrice(service ? String(service.price) : '');
    setError('');
  }, [visible, service]);

  const handleSubmit = async () => {
    setError('');

    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (price === '') {
      setError('Escribe el precio');
      return;
    }

    setLoading(true);
    try {
      const body = { name: name.trim(), durationMinutes: duration, price: Number(price) };

      if (isEditing) {
        await apiRequest(`/admin/services/${service.id}`, { method: 'PATCH', body });
      } else {
        await apiRequest('/admin/services', { method: 'POST', body });
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{isEditing ? 'Editar servicio' : 'Nuevo servicio'}</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input} placeholder="Corte de Cabello" placeholderTextColor={colors.muted}
              value={name} onChangeText={setName}
            />

            <Text style={styles.label}>Duración</Text>
            <View style={styles.row}>
              {DURATIONS.map((d) => (
                <Chip key={d} label={formatDuration(d)} selected={duration === d} onPress={() => setDuration(d)} />
              ))}
            </View>

            <Text style={styles.label}>Precio en pesos (ARS)</Text>
            <TextInput
              style={styles.input} placeholder="22000" placeholderTextColor={colors.muted}
              keyboardType="number-pad" value={price}
              onChangeText={(text) => setPrice(text.replace(/\D/g, ''))}
            />
            {price !== '' && <Text style={styles.preview}>Se mostrará como {formatPrice(Number(price))}</Text>}

            {error !== '' && <Text style={styles.error}>{error}</Text>}

            <GoldButton title="Guardar" onPress={handleSubmit} loading={loading} />

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: colors.surface, padding: 24, paddingBottom: 32, maxHeight: '90%',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: colors.gold,
  },
  title: { color: colors.gold, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  label: { color: colors.muted, fontSize: 13, marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    backgroundColor: colors.black, borderColor: colors.border, borderWidth: 1,
    borderRadius: 10, color: colors.text, padding: 14, fontSize: 16,
  },
  preview: { color: colors.goldLight, marginTop: 8, fontSize: 14 },
  error: { color: colors.error, marginVertical: 12, textAlign: 'center' },
  cancel: { color: colors.goldLight, textAlign: 'center', marginTop: 18, fontSize: 15 },
});