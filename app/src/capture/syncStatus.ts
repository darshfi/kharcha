const errors = new Map<string, string>();
const listeners = new Set<() => void>();

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
