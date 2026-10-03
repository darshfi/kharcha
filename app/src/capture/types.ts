export interface CaptureCandidate {
  userId: string;
  eventId: string;
  sourcePackage: string;
  postedAt: number;
  type: 'expense' | 'income';
  amount: string;
  balanceAfter: string | null;
  reference: string;
  date: string;
  paymentMode: 'UPI' | 'Bank transfer' | 'Card / wallet';
}

export interface CaptureStatus {
  enabled: boolean;
  sources: string[];
  permissionGranted: boolean;
  pending: number;
  skipped: Record<string, number>;
  saved: number;
  dropped: number;
  storageError: boolean;
  listenerConnected?: boolean;
  activeForAccount?: boolean;
  lastNotificationAt?: number;
  lastSourcePackage?: string;
}

export interface CaptureBridge {
  setActiveUser(userId: string | null): void;
  configure(userId: string, enabled: boolean, sources: string[]): void;
  getStatus(userId: string): string;
  getPending(userId: string): string;
  acknowledge(userId: string, eventId: string): void;
  reject(userId: string, eventId: string): void;
  openNotificationSettings(): void;
}
