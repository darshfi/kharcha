import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthContext';

export default function SettingsScreen() {
  const { theme, isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>Settings</Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Dark mode</Text>
            <TouchableOpacity
              style={[styles.toggle, { backgroundColor: isDark ? theme.accent : theme.track }]}
              onPress={toggle}
            >
              <View
                style={[
                  styles.toggleKnob,
                  { backgroundColor: isDark ? theme.accentContrast : theme.textTertiary },
                  isDark ? styles.toggleKnobOn : styles.toggleKnobOff,
                ]}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
            Currently {isDark ? 'dark' : 'light'} — follows system by default
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Account</Text>
          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
            {user?.email || 'Not signed in'}
          </Text>
          <TouchableOpacity
            style={[styles.signOutBtn, { borderColor: theme.border }]}
            onPress={() => { signOut().catch((error) => Alert.alert('Could not sign out', error?.message ?? 'Please try again.')); }}
          >
            <Text style={{ color: theme.negative, fontWeight: '600' }}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>About</Text>
          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
            Kharcha v0.1.0 — Expense tracker
          </Text>
          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
            React Native + Expo SDK 57
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 13,
    marginTop: 4,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },
  signOutBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 12,
  },
});
