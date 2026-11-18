import { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AuthScreen from './src/screens/AuthScreen';
import ClientApp from './src/screens/ClientApp';
import BarberApp from './src/screens/BarberApp';
import AdminApp from './src/screens/AdminApp';
import Background from './src/components/Background';
import Logo from './src/components/Logo';
import { apiRequest, setAuthToken, setSessionExpiredHandler } from './src/api';
import { saveSession, loadSession, clearSession } from './src/storage';
import { colors } from './src/theme';

// Each role sees its own app
const ROLE_APPS = {
  client: ClientApp,
  barber: BarberApp,
  admin: AdminApp,
};

export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  const handleLogout = useCallback(async () => {
    setAuthToken(null);
    setSession(null);
    await clearSession();
  }, []);

  const handleLogin = async (newSession) => {
    setAuthToken(newSession.token);
    setSession(newSession);
    await saveSession(newSession);
  };

  useEffect(() => {
    // If the server says the session is no longer valid, go back to the login screen
    setSessionExpiredHandler((message) => {
      handleLogout();
      Alert.alert('Sesión finalizada', message);
    });

    // On startup: restore the saved session and check it against the server
    const restore = async () => {
      const stored = await loadSession();

      if (stored) {
        setAuthToken(stored.token);
        try {
          const user = await apiRequest('/me');
          const fresh = { token: stored.token, user: { id: user.id, name: user.name, role: user.role } };
          setSession(fresh);
          await saveSession(fresh);
        } catch (e) {
          // 401 is handled by the handler above. Any other failure (no connection,
          // server down) keeps the saved session, so a bad signal doesn't log people out.
          if (e.status !== 401) setSession(stored);
        }
      }

      setChecking(false);
    };

    restore();
  }, [handleLogout]);

  const RoleApp = session ? ROLE_APPS[session.user.role] : null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Background>
        {checking ? (
          <View style={styles.loading}>
            <Logo size={160} />
            <ActivityIndicator color={colors.gold} style={styles.spinner} />
          </View>
        ) : (
          <SafeAreaView style={styles.screen}>
            {RoleApp ? <RoleApp onLogout={handleLogout} /> : <AuthScreen onLogin={handleLogin} />}
          </SafeAreaView>
        )}
      </Background>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  spinner: { marginTop: 24 },
});