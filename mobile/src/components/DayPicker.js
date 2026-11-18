import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function DayPicker({ days, value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {days.map((d) => {
        const selected = d.value === value;
        return (
          <TouchableOpacity
            key={d.value}
            style={[styles.day, selected && styles.selected]}
            onPress={() => onChange(d.value)}
          >
            <Text style={[styles.weekday, selected && styles.textSelected]}>{d.weekday}</Text>
            <Text style={[styles.number, selected && styles.textSelected]}>{d.day}</Text>
            <Text style={[styles.month, selected && styles.textSelected]}>{d.month}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  day: {
    width: 58, alignItems: 'center', paddingVertical: 10, marginRight: 8,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.black,
  },
  selected: { backgroundColor: colors.gold, borderColor: colors.gold },
  weekday: { color: colors.muted, fontSize: 12, textTransform: 'capitalize' },
  number: { color: colors.text, fontSize: 20, fontWeight: '700' },
  month: { color: colors.muted, fontSize: 12, textTransform: 'capitalize' },
  textSelected: { color: colors.black },
});