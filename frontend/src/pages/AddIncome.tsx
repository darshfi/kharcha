import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncomes } from '../context/IncomeContext';
import { format } from 'date-fns';

const MODES = [
  { value: 'Bank transfer', icon: '🏦' },
  { value: 'UPI', icon: '📱' },
  { value: 'Cash', icon: '💵' },
  { value: 'Cheque', icon: '🧾' },
  { value: 'Card / wallet', icon: '💳' },
  { value: 'Other', icon: '◌' },
];

const SOURCES = ['Salary', 'Freelance', 'Interest', 'Refund', 'Gift', 'Other'];

const AddIncome: React.FC = () => {
  const { addIncome } = useIncomes();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank transfer');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [referenceNumber, setReferenceNumber] = useState('');
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
    if (!source.trim()) {
      setError('Tell us where this came from');
      return;
    }

    setBusy(true);
    try {
      await addIncome({
        amount: parsed,
        source: source.trim(),
        paymentMode,
        date,
        referenceNumber: referenceNumber.trim() || undefined,
      });
      navigate('/');
    } catch (err: any) {
      setError(err?.message ?? 'Could not save this income');
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
        <h1 className="title">New income</h1>
      </header>

      <form onSubmit={handleSubmit} className="stack gap-4">
        {error && (
          <div className="rounded-xl border border-negative/30 bg-negative-soft px-4 py-3 text-[13px] text-negative">
            {error}
          </div>
        )}

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
              className="amount-hero w-full bg-transparent pl-7 text-positive focus:outline-none"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="stack gap-4">
          <div>
            <label className="field-label" htmlFor="source">
              Source
            </label>
            <input
              id="source"
              type="text"
              list="income-sources"
              maxLength={60}
              required
              className="field"
              placeholder="Salary, refund, gift…"
              value={source}
              onChange={e => setSource(e.target.value)}
            />
            <datalist id="income-sources">
              {SOURCES.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <span className="field-label">Payment mode</span>
            <div className="segment mt-2 flex-wrap">
              {MODES.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMode(m.value)}
                  className={`segment-item ${paymentMode === m.value ? 'segment-item-active' : ''}`}
                >
                  <span className="mr-1">{m.icon}</span>
                  {m.value}
                </button>
              ))}
            </div>
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
              <label className="field-label" htmlFor="ref">
                Reference <span className="text-dim">(optional)</span>
              </label>
              <input
                id="ref"
                type="text"
                maxLength={40}
                className="field"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
          {busy ? 'Saving…' : 'Save income'}
        </button>
      </form>
    </div>
  );
};

export default AddIncome;
