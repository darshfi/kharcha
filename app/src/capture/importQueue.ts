import type { CaptureBridge, CaptureCandidate } from './types';
import { markCaptureCommitted } from './syncStatus';

interface ImportClient {
  auth: { getSession(): Promise<{ data: { session: { user: { id: string } } | null } }> };
  rpc(name: string, params: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string } | null }>;
}

export class CaptureSyncError extends Error {}

/** Leave each candidate durable until an authenticated atomic import succeeds. */
export async function syncCaptureQueue(native: CaptureBridge, client: ImportClient, owner: string,
  isCurrent: () => boolean = () => true, onCommitted?: () => void): Promise<number> {
  let imported = 0;
  const entries = JSON.parse(native.getPending(owner)) as CaptureCandidate[];
  for (const entry of entries) {
    if (!isCurrent()) break;
    const { data: { session } } = await client.auth.getSession();
    if (!isCurrent() || session?.user.id !== owner || entry.userId !== owner) break;
    const { data, error } = await client.rpc('import_notification_transaction', {
      p_event_id: entry.eventId, p_source_package: entry.sourcePackage, p_kind: entry.type,
      p_amount: entry.amount, p_reference: entry.reference, p_date: entry.date,
      p_payment_mode: entry.paymentMode, p_balance_after: entry.balanceAfter,
      // Server checks this against auth.uid(): an auth change during the request cannot
      // accidentally import the old owner's candidate into the next owner's ledger.
      p_expected_user: owner,
    });
    if (error) {
      if (error.code === '22023') { native.reject(owner, entry.eventId); continue; }
      throw new CaptureSyncError(['PGRST202', '42883', '42P01', '42703'].includes(error.code ?? '')
        ? 'Database setup is needed before alerts can sync. Waiting alerts remain on this device.'
        : 'Alerts are waiting on this device. Open the app with a connection to retry.');
    }
    const result = data as { outcome?: string } | null;
    if (!result || !['imported', 'duplicate'].includes(result.outcome ?? '')) {
      throw new CaptureSyncError('The import could not be confirmed. The alert remains on this device.');
    }
    markCaptureCommitted(owner);
    onCommitted?.();
    // ACK the original owner's queue even if a switch occurred during a successful request.
    // The expected-user check above guarantees which ledger accepted it.
    native.acknowledge(owner, entry.eventId);
    if (result.outcome === 'imported') imported++;
  }
  return imported;
}
