import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { apiRequest } from '../../api';
import GoldButton from '../../components/GoldButton';
import ServiceModal from './ServiceModal';
import { formatPrice, formatDuration } from '../../utils/format';
import { colors } from '../../theme';

export default function ServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ visible: false, service: null });

  const load = useCallback(async () => {
    try {
      setError('');
      setServices(await apiRequest('/admin/services'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (service) => {
    try {
      await apiRequest(`/admin/services/${service.id}`, {
        method: 'PATCH',
        body: { isActive: !service.isActive },
      });
      await load();
    } catch (e) {
      Alert.alert('No se pudo actualizar el servicio', e.message);
    }
  };

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={styles.center} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Servicios</Text>

      <View style={styles.addButton}>
        <GoldButton title="Agregar servicio" onPress={() => setModal({ visible: true, service: null })} />
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{error || 'Todavía no hay servicios.'}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.isActive && styles.cardHidden]}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>
                {formatDuration(item.durationMinutes)} · {formatPrice(item.price)}
              </Text>
              <Text style={[styles.status, !item.isActive && styles.statusHidden]}>
                {item.isActive ? 'Visible para los clientes' : 'Oculto'}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setModal({ visible: true, service: item })}>
                <Text style={styles.edit}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleActive(item)}>
                <Text style={item.isActive ? styles.hide : styles.show}>
                  {item.isActive ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <ServiceModal
        visible={modal.visible}
        service={modal.service}
        onClose={() => setModal({ visible: false, service: null })}
        onSaved={() => {
          setModal({ visible: false, service: null });
          load();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  container: { flex: 1, padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  addButton: { marginBottom: 12 },
  list: { paddingBottom: 24 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderLeftWidth: 3, borderLeftColor: colors.gold, borderRadius: 10, padding: 14, marginBottom: 10,
  },
  cardHidden: { borderLeftColor: colors.border, opacity: 0.6 },
  info: { flex: 1 },
  name: { color: colors.text, fontWeight: '600', fontSize: 16 },
  detail: { color: colors.goldLight, marginTop: 3, fontSize: 14 },
  status: { color: colors.muted, marginTop: 6, fontSize: 13 },
  statusHidden: { color: colors.muted },
  actions: { alignItems: 'flex-end', gap: 12 },
  edit: { color: colors.goldLight, fontSize: 14 },
  hide: { color: colors.error, fontSize: 14 },
  show: { color: colors.gold, fontWeight: '700', fontSize: 14 },
});