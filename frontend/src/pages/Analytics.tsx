import React, { useMemo, useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useIncomes } from '../context/IncomeContext';
import { useCategories } from '../context/CategoryContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  ComposedChart, Area, XAxis, YAxis, ReferenceLine,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const RANGES = [
  { key: '7', label: '7D', days: 7 },
  { key: '30', label: '30D', days: 30 },
  { key: '90', label: '90D', days: 90 },
] as const;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Analytics: React.FC = () => {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { categories } = useCategories();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const data = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - range + 1);

    const inRange = expenses.filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= cutoff && d <= now;
    });
    const incomeInRange = incomes.filter(i => {
      const d = new Date(i.date + 'T00:00:00');
      return d >= cutoff && d <= now;
    });

    // --- Daily series with income (positive) and expenses (negative) ---
    const byDay = new Map<string, { expense: number; income: number }>();
    inRange.forEach(e => {
      const day = byDay.get(e.date) || { expense: 0, income: 0 };
      day.expense += Number(e.amount || 0);
      byDay.set(e.date, day);
    });
    incomeInRange.forEach(i => {
      const day = byDay.get(i.date) || { expense: 0, income: 0 };
      day.income += Number(i.amount || 0);
      byDay.set(i.date, day);
    });

    const series: Array<{ label: string; full: string; expense: number; income: number }> = [];
    for (let i = 0; i < range; i++) {
      const d = new Date(cutoff);
      d.setDate(cutoff.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const day = byDay.get(iso) || { expense: 0, income: 0 };
      series.push({
        label: range <= 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : `${d.getDate()}/${d.getMonth() + 1}`,
        full: formatDate(iso),
        expense: -day.expense, // negative for downward display
        income: day.income,     // positive for upward display
      });
    }

    // --- Category split ---
    const totals = new Map<string, { amount: number; icon: string; color?: string }>();
    inRange.forEach(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      const key = cat?.name ?? 'Uncategorised';
      const prev = totals.get(key) ?? { amount: 0, icon: cat?.icon ?? '•', color: cat?.color };
      prev.amount += Number(e.amount || 0);
      totals.set(key, prev);
    });
    const byCategory = [...totals.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.amount - a.amount);

    // --- Weekday split, Monday first. Buckets come from `date`, which is
    // always present, so all 7 render even when the data is thin. ---
    const weekdayTotals = Array.from({ length: 7 }, () => ({ amount: 0, count: 0 }));
    inRange.forEach(e => {
      // getDay() is 0=Sun; shift so index 0 is Monday.
      const idx = (new Date(e.date + 'T00:00:00').getDay() + 6) % 7;
      weekdayTotals[idx].amount += Number(e.amount || 0);
      weekdayTotals[idx].count += 1;
    });
    const byWeekday = WEEKDAYS.map((label, i) => ({ label, ...weekdayTotals[i] }));
    const maxWeekday = byWeekday.reduce((m, w) => Math.max(m, w.amount), 0);

    const totalSpent = inRange.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalIncome = incomeInRange.reduce((s, i) => s + Number(i.amount || 0), 0);
    const maxCategory = byCategory[0]?.amount ?? 0;
    const activeDays = series.filter(s => s.expense < 0 || s.income > 0).length;

    return {
      series, byCategory, byWeekday, totalSpent, totalIncome,
      maxCategory, maxWeekday, activeDays,
      avgPerActiveDay: activeDays > 0 ? totalSpent / activeDays : 0,
      count: inRange.length,
    };
  }, [expenses, incomes, categories, range]);

  const tooltipStyle = {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    fontSize: 13,
    color: 'var(--text-primary)',
  };

  // Recharts scales the domain to whichever side is larger, which would pin the
  // zero line to an edge and destroy the point of a diverging chart. Force it
  // symmetric so zero always sits in the middle.
  const peak = data.series.reduce((m, s) => Math.max(m, Math.abs(s.expense), s.income), 0);
  const yDomain: [number, number] = peak > 0 ? [peak * 1.15, -peak * 1.15] : [1, -1];

  return (
    <div className="stack">
      <header className="pt-2">
        <h1 className="title">Analytics</h1>
        <p className="label mt-2">Last {range} days · {data.count} transactions</p>
      </header>

      <div className="segment">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.days)}
            className={`segment-item ${range === r.days ? 'segment-item-active' : ''}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <section className="pt-2">
        <p className="label">Total spent</p>
        <p className="amount-hero mt-3">{formatCurrency(data.totalSpent)}</p>
        <p className="label mt-2">
          {formatCurrency(data.avgPerActiveDay)} per active day
        </p>
      </section>

      {/* Income vs expense — diverging around a centred zero line */}
      <section className="card">
        <div className="row mb-4">
          <p className="label">Income vs expense</p>
          {/* Hand-rolled keys rather than a Recharts <Legend>, matching the
              card headers on the dashboard. */}
          <span className="flex items-center gap-3">
            <span className="label flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
              Income
            </span>
            <span className="label flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-negative" />
              Spent
            </span>
          </span>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              {/* Faint baseline only — no horizontal gridlines competing with the areas. */}
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis hide domain={yDomain} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: 'var(--border)' }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ''}
                formatter={(value, name) => [
                  formatCurrency(Math.abs(Number(value))),
                  name === 'income' ? 'Income' : 'Spent',
                ]}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="expense"
                stroke="var(--negative)"
                strokeWidth={2}
                fill="var(--negative-soft)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--negative)', stroke: 'var(--surface)', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="income"
                stroke="var(--positive)"
                strokeWidth={2}
                fill="var(--positive-soft)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--positive)', stroke: 'var(--surface)', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Category bars — horizontal, far easier to compare than a pie */}
      <section className="card">
        <p className="label mb-4">By category</p>
        {data.byCategory.length === 0 ? (
          <p className="py-6 text-center text-base text-muted">No spending in this period</p>
        ) : (
          <div className="stack gap-4">
            {data.byCategory.map(c => (
              <div key={c.name}>
                <div className="row mb-2">
                  <span className="flex items-center gap-2 text-base text-fg">
                    <span className="text-muted">{c.icon}</span>
                    {c.name}
                  </span>
                  <span className="amount-md">{formatCurrency(c.amount)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${(c.amount / data.maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Weekday bars — hand-rolled like the category list above, so the amount
          stays visible without a hover and nothing clips on a narrow screen. */}
      <section className="card">
        <p className="label mb-4">Spending by weekday</p>
        {data.totalSpent === 0 ? (
          <p className="py-6 text-center text-base text-muted">No spending in this period</p>
        ) : (
          <div className="stack gap-4">
            {data.byWeekday.map(w => (
              <div key={w.label}>
                <div className="row mb-2">
                  <span className="text-base text-fg">{w.label}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="amount-md">{formatCurrency(w.amount)}</span>
                    {/* A 30-day window holds 5 of some weekdays and 4 of others,
                        so the count is what makes the totals comparable. */}
                    <span className="text-[11px] text-dim">{w.count}×</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${data.maxWeekday > 0 ? (w.amount / data.maxWeekday) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="row card-raised">
        <span>
          <span className="label block">Income in period</span>
          <span className="amount-lg mt-2 block text-positive">
            {formatCurrency(data.totalIncome)}
          </span>
        </span>
        <span className="text-right">
          <span className="label block">Net</span>
          <span
            className={`amount-lg mt-2 block ${
              data.totalIncome - data.totalSpent >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {formatCurrency(data.totalIncome - data.totalSpent)}
          </span>
        </span>
      </section>
    </div>
  );
};

export default Analytics;
