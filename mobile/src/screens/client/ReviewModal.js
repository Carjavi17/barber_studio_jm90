import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import GoldButton from '../../components/GoldButton';
import StarRating from '../../components/StarRating';
import { apiRequest } from '../../api';
import { formatDateTime } from '../../utils/dates';
import { colors } from '../../theme';

const MAX_COMMENT = 500;

// target is null (closed), { appointment } to write a new review, or { review } to edit one
export default function ReviewModal({ target, onClose, onSaved }) {
  const review = target?.review;
  const appointment = target?.appointment;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!target) return;
    setRating(review ? review.rating : 0);
    setComment(review?.comment || '');
    setError('');
  }, [target]);

  const handleSubmit = async () => {
    setError('');

    if (rating === 0) {
      setError('Elige de 1 a 5 estrellas');
      return;
    }

    setLoading(true);
    try {
      if (review) {
        await apiRequest(`/reviews/${review.id}`, { method: 'PATCH', body: { rating, comment } });
      } else {
        await apiRequest('/reviews', {
          method: 'POST',
          body: { appointmentId: appointment.id, rating, comment },
        });
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={target !== null} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>
              {review ? 'Editar tu reseña' : appointment ? `¿Cómo te fue con ${appointment.barber.name}?` : ''}
            </Text>
            {appointment && (
              <Text style={styles.subtitle}>
                {appointment.serviceName} · {formatDateTime(appointment.startsAt)}
              </Text>
            )}

            <View style={styles.stars}>
              <StarRating value={rating} onChange={setRating} size={36} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Cuéntanos tu experiencia (opcional)"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={MAX_COMMENT}
              value={comment}
              onChangeText={setComment}
            />
            <Text style={styles.counter}>{comment.length}/{MAX_COMMENT}</Text>

            {error !== '' && <Text style={styles.error}>{error}</Text>}

            <GoldButton title={review ? 'Guardar cambios' : 'Publicar reseña'} onPress={handleSubmit} loading={loading} />

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
  title: { color: colors.gold, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.muted, marginTop: 4, fontSize: 14, textTransform: 'capitalize' },
  stars: { marginVertical: 20 },
  input: {
    backgroundColor: colors.black, borderColor: colors.border, borderWidth: 1, borderRadius: 10,
    color: colors.text, padding: 14, fontSize: 16, minHeight: 110, textAlignVertical: 'top',
  },
  counter: { color: colors.muted, textAlign: 'right', marginTop: 6, marginBottom: 12, fontSize: 12 },
  error: { color: colors.error, marginBottom: 12, textAlign: 'center' },
  cancel: { color: colors.goldLight, textAlign: 'center', marginTop: 18, fontSize: 15 },
});