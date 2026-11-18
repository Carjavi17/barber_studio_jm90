import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import GoldButton from '../../components/GoldButton';
import { apiRequest } from '../../api';
import { colors } from '../../theme';
import PasswordInput from '../../components/PasswordInput';

const EMPTY_FORM = { name: '', phone: '', email: '', password: '' };

export default function AddBarberModal({ visible, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const close = () => {
    setForm(EMPTY_FORM);
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Nombre, correo y contraseña son obligatorios');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/admin/barbers', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password,
        },
      });
      setForm(EMPTY_FORM);
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Agregar barbero</Text>

          <TextInput
            style={styles.input} placeholder="Nombre" placeholderTextColor={colors.muted}
            value={form.name} onChangeText={setField('name')}
          />
          <TextInput
            style={styles.input} placeholder="Teléfono (opcional)" placeholderTextColor={colors.muted}
            keyboardType="phone-pad" value={form.phone} onChangeText={setField('phone')}
          />
          <TextInput
            style={styles.input} placeholder="Correo electrónico" placeholderTextColor={colors.muted}
            autoCapitalize="none" keyboardType="email-address"
            value={form.email} onChangeText={setField('email')}
          />
          <PasswordInput
            placeholder="Contraseña inicial"
            style={{ backgroundColor: colors.black }}
            value={form.password}
            onChangeText={setField('password')}
          />

          {error !== '' && <Text style={styles.error}>{error}</Text>}

          <GoldButton title="Crear barbero" onPress={handleSubmit} loading={loading} />

          <TouchableOpacity onPress={close}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: colors.surface, padding: 24, paddingBottom: 36,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: colors.gold,
  },
  title: { color: colors.gold, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: {
    backgroundColor: colors.black, borderColor: colors.border, borderWidth: 1,
    borderRadius: 10, color: colors.text, padding: 14, marginBottom: 12, fontSize: 16,
  },
  error: { color: colors.error, marginBottom: 12, textAlign: 'center' },
  cancel: { color: colors.goldLight, textAlign: 'center', marginTop: 18, fontSize: 15 },
});