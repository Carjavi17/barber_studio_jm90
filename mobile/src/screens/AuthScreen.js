import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import GoldButton from '../components/GoldButton';
import { apiRequest } from '../api';
import { colors } from '../theme';
import PasswordInput from '../components/PasswordInput';
import Logo from '../components/Logo';

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';
  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const email = form.email.trim();

      if (isRegister) {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: { name: form.name.trim(), phone: form.phone.trim(), email, password: form.password },
        });
      }

      const session = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password: form.password },
      });
      onLogin(session);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Logo size={170} style={styles.logo} />

        {isRegister && (
          <>
            <TextInput
              style={styles.input} placeholder="Nombre" placeholderTextColor={colors.muted}
              value={form.name} onChangeText={setField('name')}
            />
            <TextInput
              style={styles.input} placeholder="Teléfono" placeholderTextColor={colors.muted}
              keyboardType="phone-pad" value={form.phone} onChangeText={setField('phone')}
            />
          </>
        )}

        <TextInput
          style={styles.input} placeholder="Correo electrónico" placeholderTextColor={colors.muted}
          autoCapitalize="none" keyboardType="email-address"
          value={form.email} onChangeText={setField('email')}
        />
     <PasswordInput value={form.password} onChangeText={setField('password')} />

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <GoldButton
          title={isRegister ? 'Crear cuenta' : 'Entrar'}
          onPress={handleSubmit}
          loading={loading}
        />

        <TouchableOpacity onPress={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>
          <Text style={styles.switch}>
            {isRegister ? 'Ya tengo cuenta' : 'Crear una cuenta'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { alignSelf: 'center', marginBottom: 28 },
  input: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 10, color: colors.text, padding: 14, marginBottom: 12, fontSize: 16,
  },
  error: { color: colors.error, marginBottom: 12, textAlign: 'center' },
  switch: { color: colors.goldLight, textAlign: 'center', marginTop: 20, fontSize: 15 },
});