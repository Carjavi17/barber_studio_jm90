import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StarRating from './StarRating';
import { formatShortDate } from '../utils/dates';
import { colors } from '../theme';

export default function ReviewCard({ review, onEdit, onToggleVisible }) {
  const canEdit = review.isMine && onEdit;
  const hasActions = canEdit || onToggleVisible;

  return (
    <View style={[styles.card, !review.isVisible && styles.cardHidden]}>
      <View style={styles.top}>
        <Text style={styles.author}>{review.authorName}</Text>
        <Text style={styles.date}>{formatShortDate(review.createdAt)}</Text>
      </View>

      <StarRating value={review.rating} />

      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}

      <Text style={styles.meta}>Con {review.barberName} · {review.serviceName}</Text>

      {(review.isMine || !review.isVisible || hasActions) && (
        <View style={styles.footer}>
          <Text style={styles.tag}>
            {!review.isVisible ? 'Oculta' : review.isMine ? 'Tu reseña' : ''}
          </Text>
          <View style={styles.actions}>
            {canEdit && (
              <TouchableOpacity onPress={() => onEdit(review)}>
                <Text style={styles.edit}>Editar</Text>
              </TouchableOpacity>
            )}
            {onToggleVisible && (
              <TouchableOpacity onPress={() => onToggleVisible(review)}>
                <Text style={review.isVisible ? styles.hide : styles.show}>
                  {review.isVisible ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: colors.gold,
    borderRadius: 10, padding: 14, marginBottom: 10,
  },
  cardHidden: { borderLeftColor: colors.border, opacity: 0.6 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  author: { color: colors.text, fontWeight: '600', fontSize: 15 },
  date: { color: colors.muted, fontSize: 13, textTransform: 'capitalize' },
  comment: { color: colors.text, marginTop: 8, fontSize: 15, lineHeight: 21 },
  meta: { color: colors.muted, marginTop: 8, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  tag: { color: colors.goldLight, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 18 },
  edit: { color: colors.goldLight, fontSize: 14 },
  hide: { color: colors.error, fontSize: 14 },
  show: { color: colors.gold, fontWeight: '700', fontSize: 14 },
});