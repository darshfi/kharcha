import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../context/ExpenseContext';
import { useCategories } from '../context/CategoryContext';
import { format } from 'date-fns';

const AddExpense: React.FC = () => {
  const { addExpense } = useExpenses();
  const { categories } = useCategories();
  const navigate = useNavigate();

  const activeCategories = categories.filter(c => !c.isArchived);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than zero');
      return;
    }
    if (!categoryId) {
      setError('Pick a category');
      return;
    }

    setBusy(true);
    try {
      await addExpense({
        amount: parsed,
        description: description.trim(),
        categoryId,
        date,
        time: time || undefined,
        transactionType: 'manual',
        merchantName: merchantName.trim() || undefined,
        isRecurring: false,
      });
      navigate('/');
    } catch (err: any) {
      // Surface PostgREST's message — it names the offending column.
      setError(err?.message ?? 'Could not save this expense');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <header>
        <button onClick={() => navigate('/')} className="label mb-4 inline-block transition-colors hover:text-fg">
          ← Back
        </button>
        <h1 className="title">New expense</h1>
      </header>

      <form onSubmit={handleSubmit} className="stack gap-4">
        {error && (
          <div className="rounded-xl border border-negative/30 bg-negative-soft px-4 py-3 text-[13px] text-negative">
            {error}
          </div>
        )}

        {/* Amount gets the monetary treatment — it dominates the screen. */}
        <div className="card">
          <label className="field-label" htmlFor="amount">
            Amount
          </label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[22px] font-semibold text-dim">
              ₹
            </span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              autoFocus
              placeholder="0"
              className="amount-hero w-full bg-transparent pl-7 focus:outline-none"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="stack gap-4">
          <div>
            <label className="field-label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              required
              className="field"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">Select a category</option>
              {activeCategories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="description">
              Description
            </label>
            <input
              id="description"
              type="text"
              maxLength={120}
              className="field"
              placeholder="What was it for?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                required
                className="field"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="time">
                Time
              </label>
              <input
                id="time"
                type="time"
                className="field"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="merchant">
              Merchant <span className="text-dim">(optional)</span>
            </label>
            <input
              id="merchant"
              type="text"
              maxLength={80}
              className="field"
              placeholder="Where did you pay?"
              value={merchantName}
              onChange={e => setMerchantName(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
          {busy ? 'Saving…' : 'Save expense'}
        </button>
      </form>
    </div>
  );
};

export default AddExpense;
