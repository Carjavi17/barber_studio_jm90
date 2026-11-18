import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function TabBar({ tabs, active, onChange }) {
  return (
    <View style={styles.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  content: { flexGrow: 1 },
  tab: { flexGrow: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  label: { color: colors.muted, fontSize: 14 },
  labelActive: { color: colors.gold, fontWeight: '700' },
  indicator: { height: 3, width: 28, borderRadius: 2, backgroundColor: colors.gold, marginTop: 6 },
});