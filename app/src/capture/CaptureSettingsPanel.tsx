import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, AppState, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { supabase } from '../auth/supabase';
import { captureNative } from './native';
import { syncCaptureQueue } from './importQueue';
import type { CaptureStatus } from './types';
import { captureRefreshVersion, getCaptureSyncError, markCaptureRefreshed, subscribeCaptureSyncStatus } from './syncStatus';

export const CAPTURE_SOURCES = [
  ['com.google.android.apps.messaging', 'Google Messages'],
  ['com.samsung.android.messaging', 'Samsung Messages'],
  ['com.google.android.apps.nbu.paisa.user', 'Google Pay'],
  ['com.phonepe.app', 'PhonePe'],
  ['net.one97.paytm', 'Paytm'],
  ['com.csam.icici.bank.imobile', 'ICICI iMobile'],
  ['com.sbi.lotusintouch', 'YONO SBI'],
  ['com.hdfcbank.android.now', 'HDFC Bank'],
  ['com.snapwork.hdfc', 'HDFC Bank (old)'],
  ['com.axis.mobile', 'Axis Mobile'],
  ['com.kotak.bank.mobile', 'Kotak Bank'],
  ['com.msf.kbank.mobile', 'Kotak Bank (old)'],
] as const;

const REASONS: Record<string, string> = {
  not_completed_payment: 'OTP, request, promotion or incomplete payment',
  unclear_direction: 'No clear debit or credit',
  unclear_amount: 'Missing or conflicting amount',
  missing_or_conflicting_reference: 'Missing or conflicting transaction reference',
  invalid_date: 'Unclear date',
  stale_or_future_alert: 'Old or future alert',
  self_transfer: 'Transfer between own accounts',
  unsupported_format: 'Unsupported notification format',
  untrusted_sender: 'Sender skipped by an older app version',
  conflicting_import: 'Conflicting import values — add manually if needed',
};

export function CaptureSettingsPanel({ userId, onImported }: { userId: string | null; onImported?: () => void | Promise<void> }) {
  const { theme } = useTheme();
  const [status, setStatus] = useState<CaptureStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const syncError = useSyncExternalStore(subscribeCaptureSyncStatus, () => getCaptureSyncError(userId));
  const refresh = () => {
    if (!captureNative || !userId) return;
    try { setStatus(JSON.parse(captureNative.getStatus(userId))); }
    catch { setError('Capture storage is unavailable. Alerts cannot be safely captured on this device.'); }
  };
  useEffect(() => {
    setStatus(null); setError(null); refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    const timer = setInterval(refresh, 5000);
    return () => { listener.remove(); clearInterval(timer); };
  }, [userId]);

  const configure = (enabled: boolean, sources: string[]) => {
    if (!captureNative || !userId) return;
    if (enabled && sources.length === 0) { setError('Choose at least one source app first.'); return; }
    try { captureNative.configure(userId, enabled, sources); setError(null); refresh(); }
    catch { setError('Could not change capture settings. Sign in again and retry.'); }
  };
  const enable = () => Alert.alert('Automatically save completed payments?',
    'Kharcha will save clear debit and credit alerts from your chosen apps. Android grants notification access to all apps; Kharcha filters to your choices before reading text. Amount, date, reference and source stay encrypted on this device until synced. Full notification text is never saved. Unclear alerts are skipped.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Enable', onPress: () => { configure(true, status?.sources ?? []); } },
    ]);
  const sync = async () => {
    if (!captureNative || !userId || busy) return;
    setBusy(true); setError(null);
    let committed = false;
    try {
      await syncCaptureQueue(captureNative, supabase, userId, undefined, () => { committed = true; });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not sync alerts.'); }
    finally {
      if (committed && onImported) {
        const version = captureRefreshVersion(userId);
        try { await onImported(); markCaptureRefreshed(userId, version); }
        catch { setError('Saved alerts need a ledger refresh. The app will retry while open.'); }
      }
      refresh(); setBusy(false);
    }
  };
  const secondary = { color: theme.textSecondary };
  const label = { color: theme.textPrimary };
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <Text style={[styles.title, label]}>Automatic transactions</Text>
    {!captureNative ? <Text style={[styles.copy, secondary]}>
      {Platform.OS === 'android' ? 'Notification capture needs the Kharcha Android development or production build. Expo Go does not include the notification listener.' : 'Notification capture is available on Android. You can still add transactions manually here.'}
    </Text> : <>
      <Text style={[styles.copy, secondary]}>Clear completed payment alerts save automatically. Capture continues while the app is closed; queued alerts sync when you open the app with a connection. Open it regularly to keep your ledger current.</Text>
      <View style={styles.row}>
        <Text style={[styles.title, label]}>Capture alerts</Text>
        <Switch accessibilityLabel="Capture transaction notifications" value={status?.enabled ?? false}
          onValueChange={value => value ? enable() : configure(false, status?.sources ?? [])}
          trackColor={{ true: theme.accent, false: theme.track }} disabled={!userId || !status} />
      </View>
      <Text style={[styles.copy, secondary]}>Choose apps that send your bank or UPI payment alerts. Messages capture accepts completed payment alerts from any sender when the amount, direction and transaction reference are clear.</Text>
      {CAPTURE_SOURCES.map(([source, name]) => <Pressable key={source} accessibilityRole="checkbox"
        accessibilityState={{ checked: status?.sources.includes(source) ?? false }}
        style={styles.source} disabled={!status}
        onPress={() => configure(status?.enabled ?? false, status?.sources.includes(source)
          ? status.sources.filter(item => item !== source) : [...(status?.sources ?? []), source])}>
        <Text style={[styles.copy, label]}>{status?.sources.includes(source) ? '☑' : '☐'}  {name}</Text>
      </Pressable>)}
      <Text style={[styles.copy, secondary]}>Notification access: {status?.permissionGranted ? 'granted' : 'not granted'}</Text>
      <Pressable accessibilityRole="button" style={[styles.button, { borderColor: theme.border }]}
        onPress={() => { try { captureNative?.openNotificationSettings(); } catch { setError('Could not open Android notification settings.'); } }}>
        <Text style={{ color: theme.accent, fontWeight: '600' }}>Open Android notification access</Text>
      </Pressable>
      {status && <Text style={[styles.copy, secondary]}>{status.pending} waiting to sync · {status.saved} handled</Text>}
      {status && status.dropped > 0 && <Text style={[styles.copy, { color: theme.warning }]}>{status.dropped} alerts were skipped because the device queue was full. Check your bank history and add missing transactions manually.</Text>}
      {status && Object.entries(status.skipped).filter(([, count]) => count > 0).map(([reason, count]) =>
        <Text key={reason} style={[styles.copy, secondary]}>{count} skipped: {REASONS[reason] ?? 'Unclear alert'}</Text>)}
      {status?.storageError && <Text style={[styles.copy, { color: theme.warning }]}>A device storage error interrupted capture. Check for missing transactions in your bank history.</Text>}
      <Text style={[styles.copy, secondary]}>No reference or an ambiguous amount? The alert is skipped; add it manually if needed. Notification delivery depends on your source app and Android settings. Only new alerts after enabling are captured.</Text>
      <Pressable accessibilityRole="button" disabled={busy || !status?.pending}
        style={[styles.button, { borderColor: theme.border, opacity: busy || !status?.pending ? 0.5 : 1 }]} onPress={() => { void sync(); }}>
        <Text style={{ color: theme.accent, fontWeight: '600' }}>{busy ? 'Syncing…' : 'Sync waiting alerts'}</Text>
      </Pressable>
    </>}
    {error && <Text accessibilityRole="alert" style={[styles.copy, { color: theme.negative }]}>{error}</Text>}
    {syncError && syncError !== error && <Text accessibilityRole="alert" style={[styles.copy, { color: theme.negative }]}>{syncError}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '600' },
  copy: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  source: { paddingVertical: 5 },
  button: { borderWidth: 1, borderRadius: 10, alignItems: 'center', padding: 12, marginTop: 12 },
});
