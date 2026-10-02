const errors = new Map<string, string>();
const listeners = new Set<() => void>();
const commits = new Map<string, number>();
const refreshed = new Map<string, number>();

export function markCaptureCommitted(userId: string) {
  commits.set(userId, (commits.get(userId) ?? 0) + 1);
}
export function captureRefreshVersion(userId: string): number {
  return commits.get(userId) ?? 0;
}
export function captureNeedsRefresh(userId: string): boolean {
  return captureRefreshVersion(userId) > (refreshed.get(userId) ?? 0);
}
export function markCaptureRefreshed(userId: string, observedVersion: number) {
  // A commit arriving while a refresh is in flight still needs a subsequent refresh.
  refreshed.set(userId, Math.max(refreshed.get(userId) ?? 0, observedVersion));
}

export function setCaptureSyncError(userId: string, message: string | null) {
  if (message) errors.set(userId, message); else errors.delete(userId);
  listeners.forEach(listener => listener());
}
export function getCaptureSyncError(userId: string | null): string | null {
  return userId ? errors.get(userId) ?? null : null;
}
export function subscribeCaptureSyncStatus(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
