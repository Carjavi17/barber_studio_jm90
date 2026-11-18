import { ImageBackground, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function Background({ children }) {
  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.fill}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // The color shows for a moment while the image loads
  fill: { flex: 1, backgroundColor: colors.black },
});