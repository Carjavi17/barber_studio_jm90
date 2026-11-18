import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from 'react-native';
import GoldButton from '../../components/GoldButton';
import PasswordInput from '../../components/PasswordInput';
import { apiRequest } from '../../api';
import { colors } from '../../theme';

const EMPTY_FORM = { name: '', phone: '', email: '', password: '' };

export default function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fill the form each time a different user is opened
  useEffect(() => {
    if (user) {
      setForm({ name: user.name, phone: user.phone || '', email: user.email, password: '' });
      setError('');
    }
  }, [user]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError('');

    if (!form.name.trim() || !form.email.trim()) {
      setError('El nombre y el correo son obligatorios');
      return;
    }
    if (form.password && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          // Only sent when the admin typed a new one
          ...(form.password && { password: form.password }),
        },
      });

      if (form.password) {
        Alert.alert('Contraseña actualizada', `Entrégale la nueva contraseña a ${form.name.trim()}.`);
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = user?.role === 'barber' ? 'barbero' : 'cliente';

  return (
    <Modal visible={user !== null} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Editar {roleLabel}</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input} placeholderTextColor={colors.muted}
              value={form.name} onChangeText={setField('name')}
            />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input} placeholderTextColor={colors.muted}
              keyboardType="phone-pad" value={form.phone} onChangeText={setField('phone')}
            />

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input} placeholderTextColor={colors.muted}
              autoCapitalize="none" keyboardType="email-address"
              value={form.email} onChangeText={setField('email')}
            />

            <Text style={styles.label}>Nueva contraseña</Text>
            <PasswordInput
              placeholder="Déjala vacía para no cambiarla"
              style={{ backgroundColor: colors.black }}
              value={form.password}
              onChangeText={setField('password')}
            />

            {error !== '' && <Text style={styles.error}>{error}</Text>}

            <GoldButton title="Guardar cambios" onPress={handleSubmit} loading={loading} />

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
  label: { color: colors.muted, fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.black, borderColor: colors.border, borderWidth: 1,
    borderRadius: 10, color: colors.text, padding: 14, fontSize: 16,
  },
  error: { color: colors.error, marginVertical: 12, textAlign: 'center' },
  cancel: { color: colors.goldLight, textAlign: 'center', marginTop: 18, fontSize: 15 },
});