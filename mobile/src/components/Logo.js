import { Image } from 'react-native';

export default function Logo({ size = 120, style }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="Logo de Barber Studio JM90"
    />
  );
}