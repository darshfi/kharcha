// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { syncCaptureQueue } from '../../../app/src/capture/importQueue';
import type { CaptureBridge, CaptureCandidate } from '../../../app/src/capture/types';
import { captureNeedsRefresh, captureRefreshVersion, markCaptureCommitted, markCaptureRefreshed } from '../../../app/src/capture/syncStatus';

const candidate: CaptureCandidate = {
  userId: 'user-a', eventId: 'a'.repeat(64), sourcePackage: 'com.phonepe.app', postedAt: 1790942400000,
  type: 'expense', amount: '250.00', balanceAfter: '5000.00', reference: '426812345678',
  date: '2026-10-02', paymentMode: 'UPI',
};
function fixture(entries = [candidate]) {
  let queue = [...entries];
  const native: CaptureBridge = {
    getPending: vi.fn(() => JSON.stringify(queue)), acknowledge: vi.fn((_owner, id) => { queue = queue.filter(e => e.eventId !== id); }),
    reject: vi.fn((_owner, id) => { queue = queue.filter(e => e.eventId !== id); }),
    setActiveUser: vi.fn(), configure: vi.fn(), getStatus: vi.fn(), openNotificationSettings: vi.fn(),
  };
  const client = {
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'user-a' } } } })) },
    rpc: vi.fn(async () => ({ data: { outcome: 'imported', id: 'ledger-id', type: 'expense' }, error: null as { code?: string } | null })),
  };
  return { native, client, queue: () => queue };
}
describe('durable notification import', () => {
  it('sends the expected owner and typed amount, then acknowledges success', async () => {
    const { native, client, queue } = fixture();
    expect(await syncCaptureQueue(native, client, 'user-a')).toBe(1);
    expect(client.rpc).toHaveBeenCalledWith('import_notification_transaction', expect.objectContaining({
      p_expected_user: 'user-a', p_amount: '250.00', p_balance_after: '5000.00', p_reference: '426812345678',
    }));
    expect(queue()).toEqual([]);
  });
  it('keeps an offline candidate for restart/retry', async () => {
    const f = fixture();
    f.client.rpc.mockResolvedValue({ data: null as any, error: { code: 'network' } });
    await expect(syncCaptureQueue(f.native, f.client, 'user-a')).rejects.toThrow('waiting on this device');
    expect(f.queue()).toEqual([candidate]);
    f.client.rpc.mockResolvedValue({ data: { outcome: 'duplicate', id: 'ledger-id', type: 'expense' }, error: null });
    expect(await syncCaptureQueue(f.native, f.client, 'user-a')).toBe(0);
    expect(f.queue()).toEqual([]);
  });
  it('does not import another account’s queue', async () => {
    const f = fixture([{ ...candidate, userId: 'user-b' }]);
    expect(await syncCaptureQueue(f.native, f.client, 'user-a')).toBe(0);
    expect(f.client.rpc).not.toHaveBeenCalled();
    expect(f.native.acknowledge).not.toHaveBeenCalled();
  });
  it('stops when the authenticated account changes', async () => {
    const f = fixture();
    f.client.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-b' } } } });
    expect(await syncCaptureQueue(f.native, f.client, 'user-a')).toBe(0);
    expect(f.client.rpc).not.toHaveBeenCalled();
  });
  it('quarantines permanent conflicts and continues with later events', async () => {
    const next = { ...candidate, eventId: 'b'.repeat(64), reference: '426812345679' };
    const f = fixture([candidate, next]);
    f.client.rpc.mockResolvedValueOnce({ data: null as any, error: { code: '22023' } });
    expect(await syncCaptureQueue(f.native, f.client, 'user-a')).toBe(1);
    expect(f.native.reject).toHaveBeenCalledWith('user-a', candidate.eventId);
    expect(f.queue()).toEqual([]);
  });
  it('reports partial committed success even when a later event fails', async () => {
    const f = fixture([candidate, { ...candidate, eventId: 'b'.repeat(64), reference: '426812345679' }]);
    f.client.rpc.mockResolvedValueOnce({ data: { outcome: 'imported', id: 'ledger-id', type: 'expense' }, error: null });
    f.client.rpc.mockResolvedValueOnce({ data: null as any, error: { code: 'network' } });
    const committed = vi.fn();
    await expect(syncCaptureQueue(f.native, f.client, 'user-a', undefined, committed)).rejects.toThrow();
    expect(committed).toHaveBeenCalledOnce();
    expect(f.queue()).toHaveLength(1);
  });
  it('reports committed success before an ACK failure, and reloads on duplicate retry', async () => {
    const f = fixture();
    f.native.acknowledge = vi.fn(() => { throw new Error('Disk full'); });
    const committed = vi.fn();
    await expect(syncCaptureQueue(f.native, f.client, 'user-a', undefined, committed)).rejects.toThrow('Disk full');
    expect(committed).toHaveBeenCalledOnce();
    expect(f.queue()).toHaveLength(1);
    f.client.rpc.mockResolvedValue({ data: { outcome: 'duplicate', id: 'ledger-id', type: 'expense' }, error: null });
    f.native.acknowledge = vi.fn();
    await syncCaptureQueue(f.native, f.client, 'user-a', undefined, committed);
    expect(committed).toHaveBeenCalledTimes(2);
  });
  it('never acknowledges an unconfirmed server response', async () => {
    const f = fixture();
    f.client.rpc.mockResolvedValue({ data: {} as any, error: null });
    await expect(syncCaptureQueue(f.native, f.client, 'user-a')).rejects.toThrow('could not be confirmed');
    expect(f.native.acknowledge).not.toHaveBeenCalled();
  });
  it('retains a refresh obligation after ACK until the ledger refresh succeeds', async () => {
    const f = fixture();
    await syncCaptureQueue(f.native, f.client, 'user-a');
    expect(f.queue()).toEqual([]);
    expect(captureNeedsRefresh('user-a')).toBe(true);
    // A failed fetch deliberately does not mark any version refreshed.
    const version = captureRefreshVersion('user-a');
    markCaptureRefreshed('user-a', version);
    expect(captureNeedsRefresh('user-a')).toBe(false);
  });
  it('a commit during an in-flight ledger refresh requires another refresh', () => {
    markCaptureCommitted('refresh-race-user');
    const snapshot = captureRefreshVersion('refresh-race-user');
    markCaptureCommitted('refresh-race-user');
    markCaptureRefreshed('refresh-race-user', snapshot);
    expect(captureNeedsRefresh('refresh-race-user')).toBe(true);
    expect(captureNeedsRefresh('unrelated-user')).toBe(false);
  });
});
