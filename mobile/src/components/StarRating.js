import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function StarRating({ value, onChange, size = 18 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={colors.gold} />
        );

        if (!onChange) {
          return <View key={n} style={{ marginRight: 2 }}>{star}</View>;
        }
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            accessibilityLabel={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            style={{ marginRight: 6 }}
          >
            {star}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}