import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { apiRequest } from '../../api';
import ReviewCard from '../../components/ReviewCard';
import StarRating from '../../components/StarRating';
import ReviewModal from './ReviewModal';
import { formatDateTime } from '../../utils/dates';
import { formatRating } from '../../utils/format';
import { colors } from '../../theme';

export default function ReviewsScreen() {
  const [summary, setSummary] = useState({ average: null, count: 0 });
  const [reviews, setReviews] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null); // what the modal is writing or editing

  const load = useCallback(async () => {
    try {
      setError('');
      const [reviewsData, pendingData] = await Promise.all([
        apiRequest('/reviews'),
        apiRequest('/reviews/pending'),
      ]);
      setSummary(reviewsData.summary);
      setReviews(reviewsData.reviews);
      setPending(pendingData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={styles.center} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Reseñas</Text>

            {summary.count > 0 ? (
              <View style={styles.summary}>
                <Text style={styles.average}>{formatRating(summary.average)}</Text>
                <View>
                  <StarRating value={Math.round(summary.average)} size={22} />
                  <Text style={styles.count}>
                    {summary.count === 1 ? '1 reseña' : `${summary.count} reseñas`}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.muted}>Todavía no hay reseñas. ¡Sé el primero en dejar una!</Text>
            )}

            {pending.length > 0 && (
              <View>
                <Text style={styles.heading}>Cuéntanos cómo te fue</Text>
                {pending.map((appointment) => (
                  <View key={appointment.id} style={styles.pendingCard}>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingService}>{appointment.serviceName}</Text>
                      <Text style={styles.pendingDetail}>
                        Con {appointment.barber.name} · {formatDateTime(appointment.startsAt)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setTarget({ appointment })}>
                      <Text style={styles.rate}>Calificar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {reviews.length > 0 && <Text style={styles.heading}>Lo que dicen los clientes</Text>}
          </View>
        }
        ListEmptyComponent={error ? <Text style={styles.error}>{error}</Text> : null}
        renderItem={({ item }) => (
          <ReviewCard review={item} onEdit={(review) => setTarget({ review })} />
        )}
      />

      <ReviewModal
        target={target}
        onClose={() => setTarget(null)}
        onSaved={() => {
          setTarget(null);
          load();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 14 },
  muted: { color: colors.muted },
  error: { color: colors.error, textAlign: 'center', marginTop: 24 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  average: { color: colors.gold, fontSize: 48, fontWeight: '800' },
  count: { color: colors.muted, marginTop: 4, fontSize: 14 },
  heading: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 10 },
  pendingCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderColor: colors.gold, borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 8,
  },
  pendingInfo: { flex: 1, marginRight: 12 },
  pendingService: { color: colors.text, fontWeight: '600', fontSize: 15 },
  pendingDetail: { color: colors.muted, marginTop: 2, fontSize: 13, textTransform: 'capitalize' },
  rate: { color: colors.gold, fontWeight: '700', fontSize: 15 },
});