/**
 * THE MAPPING LAYER — single source of truth for camelCase ⇄ snake_case.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The supabase-js client does NOT convert `categoryId` to `category_id`.
 * Postgres columns are snake_case, so sending a camelCase key in an insert
 * makes PostgREST fail with:
 *
 *     {"code":"PGRST204","message":"Could not find the 'categoryId' column"}
 *
 * Every component in this app speaks camelCase (TypeScript convention).
 * Every table speaks snake_case (Postgres convention). Rather than patch
 * each call site — and get it wrong again on the next one — ALL translation
 * happens here. Components never change; contexts never build raw payloads.
 *
 * RULE: nothing outside this file may build a Supabase insert/update body.
 */

// =====================================================
// Column lists, straight from database/schema.sql
// =====================================================

export const EXPENSE_COLUMNS = [
  'id',
  'user_id',
  'category_id',
  'amount',
  'description',
  'date',
  'time',
  'transaction_type',
  'upi_ref_number',
  'merchant_name',
  'receipt_url',
  'balance_after',
  'status',
  'is_recurring',
  'recurring_frequency',
  'created_at',
  'updated_at',
] as const

export const CATEGORY_COLUMNS = [
  'id',
  'user_id',
  'name',
  'icon',
  'color',
  'is_custom',
  'is_archived',
  'order_index',
  'created_at',
] as const

export const INCOME_COLUMNS = [
  'id',
  'user_id',
  'amount',
  'source',
  'payment_mode',
  'date',
  'reference_number',
  'created_at',
  'updated_at',
] as const

export const BUDGET_COLUMNS = [
  'id',
  'user_id',
  'category_id',
  'monthly_limit',
  'alert_threshold',
  'month_year',
  'current_spend',
  'created_at',
  'updated_at',
] as const

// =====================================================
// Shape helpers — drop any key that is not a real column
// =====================================================

/** Omit undefined fields; preserve explicit NULLs when clearing optional values. */
function pick(source: Record<string, unknown>, allowed: readonly string[]) {
  const out: Record<string, unknown> = {}
  for (const key of allowed) {
    const v = source[key]
    if (v !== undefined) out[key] = v
  }
  return out
}

/** Postgres NUMERIC comes back as a string; app code expects a number. */
function toNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null) return fallback
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** `'2026-09-25'` ⇄ `'25/09/2026'`. Dates cross the wire as YYYY-MM-DD. */
export function toIsoDate(value: string): string {
  // Already an ISO date (or an ISO timestamp) — take the date part.
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const [d, m, y] = value.split('/')
  if (d && m && y) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  return value
}

export function toDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (y && m && d) return `${d}/${m}/${y}`
  return iso
}

/** `new Date()` → `HH:MM:SS`, which is what a Postgres TIME column wants. */
export function toDbTime(value?: string): string | undefined {
  if (!value) return undefined
  const m = value.match(/^(\d{1,2}):(\d{2})/)
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}:00`
  return value
}

/** The current month in the `YYYY-MM` format `budgets.month_year` expects. */
export function currentMonthYear(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// =====================================================
// EXPENSES
// =====================================================

/** camelCase app row → snake_case DB row. */
/** Updates must never fill unspecified fields with insert defaults. */
function mapChanges(input: Record<string, any>, fields: Record<string, string>) {
  const changes: Record<string, unknown> = {}
  for (const [key, column] of Object.entries(fields)) {
    const value = input[key] !== undefined ? input[key] : input[column]
    if (value !== undefined) {
      changes[column] = column === 'date' && value != null ? toIsoDate(value)
        : column === 'time' && value != null ? toDbTime(value) : value
    }
  }
  return changes
}

export function toDbExpense(input: Record<string, any>, userId: string, partial = false) {
  if (partial) return mapChanges(input, {
    amount: 'amount', description: 'description', categoryId: 'category_id', date: 'date', time: 'time',
    transactionType: 'transaction_type', upiRefNumber: 'upi_ref_number', merchantName: 'merchant_name',
    receiptUrl: 'receipt_url', balanceAfter: 'balance_after', status: 'status', isRecurring: 'is_recurring',
    recurringFrequency: 'recurring_frequency',
  })
  return pick(
    {
      id: input.id,
      user_id: userId,
      category_id: input.categoryId ?? input.category_id ?? null,
      amount: toNumber(input.amount),
      description: input.description ?? null,
      date: toIsoDate(input.date),
      time: toDbTime(input.time),
      transaction_type: input.transactionType ?? 'manual',
      upi_ref_number: input.upiRefNumber ?? null,
      merchant_name: input.merchantName ?? null,
      receipt_url: input.receiptUrl ?? null,
      balance_after: input.balanceAfter ?? null,
      status: input.status ?? 'confirmed',
      is_recurring: input.isRecurring ?? false,
      recurring_frequency: input.recurringFrequency ?? null,
    },
    EXPENSE_COLUMNS,
  )
}

/** snake_case DB row → camelCase app row. */
export function fromDbExpense(row: Record<string, any>) {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    amount: toNumber(row.amount),
    description: row.description ?? '',
    date: row.date,
    time: row.time ?? undefined,
    transactionType: row.transaction_type ?? 'manual',
    upiRefNumber: row.upi_ref_number ?? undefined,
    merchantName: row.merchant_name ?? undefined,
    receiptUrl: row.receipt_url ?? undefined,
    balanceAfter: row.balance_after != null ? toNumber(row.balance_after) : undefined,
    status: row.status ?? 'confirmed',
    isRecurring: row.is_recurring ?? false,
    recurringFrequency: row.recurring_frequency ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// =====================================================
// CATEGORIES
// =====================================================

export function toDbCategory(input: Record<string, any>, userId: string, partial = false) {
  if (partial) return mapChanges(input, {
    name: 'name', icon: 'icon', color: 'color', isCustom: 'is_custom', isArchived: 'is_archived', orderIndex: 'order_index',
  })
  return pick(
    {
      id: input.id,
      user_id: userId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      is_custom: input.isCustom ?? input.is_custom ?? true,
      is_archived: input.isArchived ?? input.is_archived ?? false,
      order_index: input.orderIndex ?? input.order_index ?? 0,
    },
    CATEGORY_COLUMNS,
  )
}

export function fromDbCategory(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isCustom: row.is_custom ?? false,
    isArchived: row.is_archived ?? false,
    orderIndex: row.order_index ?? 0,
    createdAt: row.created_at,
  }
}

// =====================================================
// INCOMES
// =====================================================

export function toDbIncome(input: Record<string, any>, userId: string, partial = false) {
  if (partial) return mapChanges(input, {
    amount: 'amount', source: 'source', paymentMode: 'payment_mode', date: 'date', referenceNumber: 'reference_number',
  })
  return pick(
    {
      id: input.id,
      user_id: userId,
      amount: toNumber(input.amount),
      source: input.source,
      payment_mode: input.paymentMode ?? input.payment_mode,
      date: toIsoDate(input.date),
      reference_number: input.referenceNumber ?? input.reference_number ?? null,
    },
    INCOME_COLUMNS,
  )
}

export function fromDbIncome(row: Record<string, any>) {
  return {
    id: row.id,
    amount: toNumber(row.amount),
    source: row.source,
    paymentMode: row.payment_mode,
    date: row.date,
    referenceNumber: row.reference_number ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// =====================================================
// BUDGETS
// =====================================================

export function toDbBudget(input: Record<string, any>, userId: string, partial = false) {
  if (partial) return mapChanges(input, {
    categoryId: 'category_id', monthlyLimit: 'monthly_limit', alertThreshold: 'alert_threshold', monthYear: 'month_year',
  })
  return pick(
    {
      id: input.id,
      user_id: userId,
      category_id: input.categoryId ?? input.category_id,
      monthly_limit: toNumber(input.monthlyLimit ?? input.monthly_limit),
      alert_threshold: input.alertThreshold ?? input.alert_threshold ?? 0.8,
      // NOT NULL with no DB default — the caller must supply this or the
      // insert fails. Defaulting here to the current month.
      month_year: input.monthYear ?? input.month_year ?? currentMonthYear(),
      current_spend: toNumber(input.currentSpend ?? input.current_spend, 0),
    },
    BUDGET_COLUMNS,
  )
}

export function fromDbBudget(row: Record<string, any>) {
  return {
    id: row.id,
    categoryId: row.category_id,
    monthlyLimit: toNumber(row.monthly_limit),
    alertThreshold: toNumber(row.alert_threshold, 0.8),
    monthYear: row.month_year,
    currentSpend: toNumber(row.current_spend),
    categoryName: row.expense_categories?.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
