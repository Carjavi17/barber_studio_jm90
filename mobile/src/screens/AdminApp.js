import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader';
import TabBar from '../components/TabBar';
import UsersScreen from './admin/UsersScreen';
import BlocksScreen from './admin/BlocksScreen';
import { colors } from '../theme';
import AdminAppointmentsScreen from './admin/AdminAppointmentsScreen';
import ServicesScreen from './admin/ServicesScreen';
import AdminReviewsScreen from './admin/AdminReviewsScreen';

const TABS = [
  { key: 'appointments', label: 'Turnos' },
  { key: 'barbers', label: 'Barberos' },
  { key: 'clients', label: 'Clientes' },
  { key: 'blocks', label: 'Horarios' },
  { key: 'services', label: 'Servicios' },
  { key: 'reviews', label: 'Reseñas' },
];

export default function AdminApp({ onLogout }) {
  const [tab, setTab] = useState('appointments');
  

  const renderTab = () => {
    // The key makes React create a fresh screen when switching between barbers and clients
    if (tab === 'appointments') return <AdminAppointmentsScreen />;
    if (tab === 'barbers') return <UsersScreen key="barber" role="barber" />;
    if (tab === 'clients') return <UsersScreen key="client" role="client" />;
    if (tab === 'blocks') return <BlocksScreen />;
    if (tab === 'reviews') return <AdminReviewsScreen />;
    return <ServicesScreen />;
  };

  return (
    <View style={styles.container}>
      <AppHeader onLogout={onLogout} />
      <View style={styles.content}>{renderTab()}</View>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});