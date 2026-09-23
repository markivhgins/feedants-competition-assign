import { View, Text, StyleSheet } from 'react-native';

export default function Metric({ label, value, prefix }) {
  return <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{prefix ? `${prefix} ${value}` : value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { color: '#6d7ea0', fontSize: 13, marginBottom: 3, fontWeight: '600' },
  value: { color: '#0f2b54', fontSize: 25, fontWeight: '900' }
});
