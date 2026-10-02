import React, { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { enter, exit, useMotionDisabled } from '../lib/motion';
import MotionPressable from './MotionPressable';

export type SavedNotice = { id: number; title: string; detail: string };

/** A quiet confirmation that leaves the form usable and respects accessibility timeouts. */
export default function SavedToast({ notice, onDismiss }: { notice: SavedNotice | null; onDismiss: () => void }) {
  const { theme } = useTheme();
  const reduced = useMotionDisabled();
  useEffect(() => {
    if (!notice) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(`${notice.title}. ${notice.detail}`);
    const duration = Platform.OS === 'android'
      ? AccessibilityInfo.getRecommendedTimeoutMillis(4000).catch(() => 4000)
      : Promise.resolve(4000);
    void duration.then(ms => { if (active) timer = setTimeout(onDismiss, Math.max(4000, ms)); });
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [notice, onDismiss]);

  if (!notice) return null;
  return <Animated.View key={notice.id} entering={reduced ? undefined : enter} exiting={reduced ? undefined : exit}
    style={[styles.card, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
    <View style={[styles.check, { backgroundColor: theme.positiveSoft }]} accessible={false}>
      <Text style={{ color: theme.positive, fontSize: 19, fontWeight: '700' }}>✓</Text>
    </View>
    <View style={styles.copy} accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={[styles.title, { color: theme.textPrimary }]}>{notice.title}</Text>
      <Text style={[styles.detail, { color: theme.textSecondary }]}>{notice.detail}</Text>
    </View>
    <MotionPressable accessibilityLabel="Dismiss confirmation" onPress={onDismiss} hitSlop={8} style={styles.dismiss}>
      <Text style={{ color: theme.textSecondary, fontSize: 22 }}>×</Text>
    </MotionPressable>
  </Animated.View>;
}

const styles = StyleSheet.create({
  card: { position: 'absolute', bottom: 20, left: 16, right: 16, borderRadius: 14, borderWidth: 1, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 5 } },
  check: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 }, title: { fontSize: 15, fontWeight: '700' }, detail: { fontSize: 12, lineHeight: 18 },
  dismiss: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
});
