import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthContext';

export default function AuthScreen() {
  const { theme } = useTheme();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = isLogin
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.logo, { color: theme.accent }]}>K</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Kharcha</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </Text>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textTertiary}
              secureTextEntry
              autoCapitalize="none"
            />

            {error && (
              <Text style={[styles.error, { color: theme.negative }]}>{error}</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={{ color: theme.accentContrast, fontWeight: '700', fontSize: 15 }}>
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border }]}
              onPress={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
            >
              <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>
                {isLogin ? 'Need an account? Sign up' : 'Have an account? Sign in'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    width: 72,
    height: 72,
    lineHeight: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    textAlignVertical: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    marginTop: 12,
  },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
});
