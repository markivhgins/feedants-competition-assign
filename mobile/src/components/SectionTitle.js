import { Text, StyleSheet } from 'react-native';

export default function SectionTitle({ children }) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    color: '#14284b',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12
  }
});
