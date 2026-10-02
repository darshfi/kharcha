import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../auth/supabase';
import { captureNative } from './native';
import { CaptureSyncError, syncCaptureQueue } from './importQueue';
import { captureNeedsRefresh, captureRefreshVersion, markCaptureRefreshed, setCaptureSyncError } from './syncStatus';

/** Mount once within AuthProvider; pass null until the current account's data is ready. */
export function useAutomaticCapture(userId: string | null, onImported: () => void | Promise<void>) {
  const callback = useRef(onImported);
  callback.current = onImported;
  useEffect(() => {
    if (!captureNative) return;
    let current = true;
    let syncing = false;
    const native = captureNative;
    const sync = async () => {
      if (!userId || !current || syncing || AppState.currentState !== 'active') return;
      syncing = true;
      try {
        await syncCaptureQueue(native, supabase, userId, () => current);
        if (current) setCaptureSyncError(userId, null);
      } catch (error) {
        if (current) setCaptureSyncError(userId, error instanceof CaptureSyncError ? error.message : 'Could not sync alerts safely. They remain queued on this device.');
      } finally {
        // A later RPC/ACK failure must not hide an earlier committed ledger row.
        if (captureNeedsRefresh(userId) && current) {
          const version = captureRefreshVersion(userId);
          try {
            await callback.current();
            if (current) markCaptureRefreshed(userId, version);
          } catch {
            if (current) setCaptureSyncError(userId, 'Saved alerts need a ledger refresh. The app will retry while open.');
          }
        }
        syncing = false;
      }
    };
    // Consent is retained per account; this only sets the current queue owner.
    try { native.setActiveUser(userId); } catch {
      if (userId) setCaptureSyncError(userId, 'Capture storage is unavailable. Alerts cannot be safely captured on this device.');
      return;
    }
    void sync();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void sync(); });
    const interval = setInterval(() => { void sync(); }, 15000);
    return () => {
      current = false;
      listener.remove();
      clearInterval(interval);
      try { native.setActiveUser(null); } catch { /* Storage status remains visible. */ }
    };
  }, [userId]);
}
