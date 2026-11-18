import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function Chip({ label, selected = false, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.selected]} onPress={onPress}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderColor: colors.gold, borderWidth: 1, borderRadius: 20,
    paddingVertical: 9, paddingHorizontal: 16,
  },
  selected: { backgroundColor: colors.gold },
  label: { color: colors.gold, fontSize: 15 },
  labelSelected: { color: colors.black, fontWeight: '700' },
});