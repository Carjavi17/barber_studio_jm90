import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { apiRequest } from '../../api';
import ReviewCard from '../../components/ReviewCard';
import { colors } from '../../theme';

export default function AdminReviewsScreen() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setReviews(await apiRequest('/admin/reviews'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setVisible = async (review, isVisible) => {
    try {
      await apiRequest(`/admin/reviews/${review.id}/visible`, { method: 'PATCH', body: { isVisible } });
      await load();
    } catch (e) {
      Alert.alert('No se pudo actualizar la reseña', e.message);
    }
  };

  const handleToggle = (review) => {
    if (!review.isVisible) {
      setVisible(review, true);
      return;
    }
    Alert.alert('Ocultar reseña', 'Ningún cliente podrá verla. Puedes volver a mostrarla cuando quieras.', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, ocultar', style: 'destructive', onPress: () => setVisible(review, false) },
    ]);
  };

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={styles.center} />;
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Reseñas ({reviews.length})</Text>
          <Text style={styles.hint}>Las reseñas ocultas no las ve ningún cliente.</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{error || 'Todavía no hay reseñas.'}</Text>}
      renderItem={({ item }) => <ReviewCard review={item} onToggleVisible={handleToggle} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  list: { padding: 16, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  hint: { color: colors.muted, marginTop: 4, marginBottom: 14, fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 32 },
});