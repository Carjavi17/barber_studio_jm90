import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { apiRequest } from '../../api';
import GoldButton from '../../components/GoldButton';
import AddBarberModal from './AddBarberModal';
import EditUserModal from './EditUserModal';
import { colors } from '../../theme';

const LABELS = {
  barber: {
    title: 'Barberos',
    empty: 'Todavía no hay barberos.',
    consequence: 'ya no podrá iniciar sesión ni recibir reservas',
  },
  client: {
    title: 'Clientes',
    empty: 'Todavía no hay clientes registrados.',
    consequence: 'ya no podrá iniciar sesión',
  },
};

export default function UsersScreen({ role }) {
  const labels = LABELS[role];
  const isBarber = role === 'barber';

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const load = useCallback(async () => {
    try {
      setError('');
      setUsers(await apiRequest(`/admin/users?role=${role}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  // Filter by name or email as you type (no server request needed)
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
  }, [users, search]);

  const setActive = async (user, isActive) => {
    try {
      await apiRequest(`/admin/users/${user.id}/active`, {
        method: 'PATCH',
        body: { isActive },
      });
      await load();
    } catch (e) {
      Alert.alert('No se pudo actualizar', e.message);
    }
  };

  const handleToggle = (user) => {
    if (!user.isActive) {
      setActive(user, true);
      return;
    }
    Alert.alert(`Desactivar a ${user.name}`, `${user.name} ${labels.consequence}. ¿Continuar?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, desactivar', style: 'destructive', onPress: () => setActive(user, false) },
    ]);
  };

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={styles.center} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{labels.title} ({users.length})</Text>
      </View>

      <TextInput
        style={styles.search} placeholder="Buscar por nombre o correo"
        placeholderTextColor={colors.muted} value={search} onChangeText={setSearch}
        autoCapitalize="none"
      />

      {isBarber && (
        <View style={styles.addButton}>
          <GoldButton title="Agregar barbero" onPress={() => setShowAdd(true)} />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {error || (search ? 'No se encontraron resultados.' : labels.empty)}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.isActive && styles.cardInactive]}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>{item.email}</Text>
              {item.phone ? <Text style={styles.detail}>{item.phone}</Text> : null}
              <Text style={[styles.status, !item.isActive && styles.statusInactive]}>
                {item.isActive ? 'Activo' : 'Desactivado'}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setEditingUser(item)}>
                <Text style={styles.edit}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleToggle(item)}>
                <Text style={item.isActive ? styles.deactivate : styles.activate}>
                  {item.isActive ? 'Desactivar' : 'Activar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {isBarber && (
        <AddBarberModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={() => {
          setEditingUser(null);
          load();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  container: { flex: 1, padding: 16 },
  titleRow: { marginBottom: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  search: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 10, color: colors.text, padding: 12, marginBottom: 12, fontSize: 15,
  },
  addButton: { marginBottom: 12 },
  list: { paddingBottom: 24 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderLeftWidth: 3, borderLeftColor: colors.gold, borderRadius: 10, padding: 14, marginBottom: 10,
  },
  cardInactive: { borderLeftColor: colors.border, opacity: 0.6 },
  info: { flex: 1 },
  name: { color: colors.text, fontWeight: '600', fontSize: 16 },
  detail: { color: colors.muted, marginTop: 2, fontSize: 14 },
  status: { color: colors.goldLight, marginTop: 6, fontSize: 13 },
  statusInactive: { color: colors.muted },
  actions: { alignItems: 'flex-end', gap: 12 },
  edit: { color: colors.goldLight, fontSize: 14 },
  deactivate: { color: colors.error, fontSize: 14 },
  activate: { color: colors.gold, fontWeight: '700', fontSize: 14 },
});