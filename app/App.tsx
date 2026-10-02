import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { View, ActivityIndicator, Text, Button, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

function Root() {
  const { user, loading, dataLoading, dataError, retryLoad, signOut } = useAuth();
  const { theme } = useTheme();

  if (loading || (user && dataLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (user && dataError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: 24, gap: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>{dataError}</Text>
        <Button title="Try again" onPress={retryLoad} />
        <Button title="Sign out" onPress={() => { signOut().catch(() => Alert.alert('Could not sign out', 'Please try again.')); }} />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthScreen />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <Root />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
