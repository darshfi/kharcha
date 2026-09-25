import React, { useEffect, useState } from 'react';
import { useBudgets } from '../context/BudgetContext';
import { useCategories } from '../context/CategoryContext';
import { formatCurrency } from '../utils/formatters';
import { currentMonthYear } from '../lib/mappers';

const Budgets: React.FC = () => {
  const { budgets, loading, fetchBudgets, addBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();

  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thisMonth = currentMonthYear();
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const activeCategories = categories.filter(c => !c.isArchived);
  const alreadyBudgeted = new Set(budgets.map(b => b.categoryId));
  const available = activeCategories.filter(c => !alreadyBudgeted.has(c.id));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(limit);
    if (!categoryId) {
      setError('Pick a category');
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a limit greater than zero');
      return;
    }

    setBusy(true);
    try {
      await addBudget({
        categoryId,
        monthlyLimit: parsed,
        alertThreshold: 0.8,
        monthYear: thisMonth,
      });
      setCategoryId('');
      setLimit('');
    } catch (err: any) {
      setError(err?.message ?? 'Could not create this budget');
    } finally {
      setBusy(false);
    }
  };

  const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.currentSpend, 0);

  return (
    <div className="stack">
      <header className="pt-2">
        <h1 className="title">Budgets</h1>
        <p className="label mt-2">{monthLabel}</p>
      </header>

      {budgets.length > 0 && (
        <section className="card">
          <p className="label">Across all budgets</p>
          <p className="amount-hero mt-3">{formatCurrency(totalSpent)}</p>
          <p className="label mt-2">of {formatCurrency(totalLimit)} budgeted</p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-track">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                totalSpent > totalLimit ? 'bg-negative' : 'bg-accent'
              }`}
              style={{ width: `${Math.min(100, (totalSpent / totalLimit) * 100)}%` }}
            />
          </div>
        </section>
      )}

      {budgets.length > 0 && budgets.some(b => b.currentSpend / b.monthlyLimit >= 0.8) && (
        <section className="rounded-2xl border border-warning/30 bg-warning-soft p-4">
          <p className="text-[13px] text-warning">
            {budgets.filter(b => b.currentSpend / b.monthlyLimit >= 0.8).length} budget
            {budgets.filter(b => b.currentSpend / b.monthlyLimit >= 0.8).length > 1 ? 's are' : ' is'} over
            80% spent
          </p>
        </section>
      )}

      <form onSubmit={handleAdd} className="card stack gap-4">
        {error && (
          <div className="rounded-xl border border-negative/30 bg-negative-soft px-4 py-3 text-[13px] text-negative">
            {error}
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="cat">
            Category
          </label>
          <select
            id="cat"
            className="field mt-2"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            <option value="">Select a category</option>
            {available.map(c => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          {available.length === 0 && (
            <p className="label mt-2">Every active category already has a budget</p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="limit">
            Monthly limit
          </label>
          <input
            id="limit"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            className="field mt-2"
            placeholder="0"
            value={limit}
            onChange={e => setLimit(e.target.value)}
          />
        </div>

        <button type="submit" disabled={busy || available.length === 0} className="btn-primary w-full">
          {busy ? 'Adding…' : 'Add budget'}
        </button>
      </form>

      <section className="card">
        <p className="label mb-3">This month</p>

        {loading ? (
          <p className="py-6 text-center text-base text-muted">Loading…</p>
        ) : budgets.length === 0 ? (
          <p className="py-6 text-center text-base text-muted">No budgets set yet</p>
        ) : (
          <div className="stack gap-4">
            {budgets.map(b => {
              const pct = b.monthlyLimit > 0 ? b.currentSpend / b.monthlyLimit : 0;
              const over = pct >= 1;
              const near = pct >= b.alertThreshold;
              return (
                <div key={b.id}>
                  <div className="row mb-2">
                    <span className="text-base text-fg">{b.categoryName ?? 'Category'}</span>
                    <button
                      onClick={() => deleteBudget(b.id)}
                      className="label transition-colors hover:text-negative"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="row mb-2">
                    <span className={`amount-md ${over ? 'text-negative' : near ? 'text-warning' : ''}`}>
                      {formatCurrency(b.currentSpend)}
                    </span>
                    <span className="label">of {formatCurrency(b.monthlyLimit)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        over ? 'bg-negative' : near ? 'bg-warning' : 'bg-accent'
                      }`}
                      style={{ width: `${Math.min(100, pct * 100)}%` }}
                    />
                  </div>
                  {over && <p className="label mt-2 text-negative">Over budget</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Budgets;
