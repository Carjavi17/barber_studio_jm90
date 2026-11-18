import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader';
import TabBar from '../components/TabBar';
import BookScreen from './client/BookScreen';
import MyAppointmentsScreen from './client/MyAppointmentsScreen';
import ReviewsScreen from './client/ReviewsScreen';

const TABS = [
  { key: 'book', label: 'Reservar' },
  { key: 'appointments', label: 'Mis turnos' },
  { key: 'reviews', label: 'Reseñas' },
];

export default function ClientApp({ onLogout }) {
  const [tab, setTab] = useState('book');

  const renderTab = () => {
    if (tab === 'book') return <BookScreen />;
    if (tab === 'appointments') return <MyAppointmentsScreen />;
    return <ReviewsScreen />;
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