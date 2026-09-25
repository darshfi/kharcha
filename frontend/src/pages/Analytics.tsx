import React, { useMemo, useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useIncomes } from '../context/IncomeContext';
import { useCategories } from '../context/CategoryContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const RANGES = [
  { key: '7', label: '7D', days: 7 },
  { key: '30', label: '30D', days: 30 },
  { key: '90', label: '90D', days: 90 },
] as const;

const Analytics: React.FC = () => {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { categories } = useCategories();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const data = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (range - 1));

    const inRange = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= cutoff && d <= new Date();
    });
    const incomeInRange = incomes.filter(i => {
      const d = new Date(i.date);
      return d >= cutoff && d <= new Date();
    });

    // --- Daily series, gap-filled so the line has no false jumps ---
    const byDay = new Map<string, number>();
    inRange.forEach(e => {
      byDay.set(e.date, (byDay.get(e.date) ?? 0) + Number(e.amount || 0));
    });
    const series: Array<{ label: string; full: string; amount: number }> = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(cutoff.getTime() + 0);
      d.setDate(cutoff.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      series.push({
        label: range <= 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : `${d.getDate()}/${d.getMonth() + 1}`,
        full: formatDate(iso),
        amount: byDay.get(iso) ?? 0,
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

    // --- Top merchants ---
    const byMerchant = new Map<string, number>();
    inRange.forEach(e => {
      const name = e.merchantName?.trim() || e.description?.trim() || 'Unlabelled';
      byMerchant.set(name, (byMerchant.get(name) ?? 0) + Number(e.amount || 0));
    });
    const topMerchants = [...byMerchant.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const totalSpent = inRange.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalIncome = incomeInRange.reduce((s, i) => s + Number(i.amount || 0), 0);
    const maxCategory = byCategory[0]?.amount ?? 0;
    const activeDays = series.filter(s => s.amount > 0).length;

    return {
      series, byCategory, topMerchants, totalSpent, totalIncome,
      maxCategory, activeDays,
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

      {/* Spending over time */}
      <section className="card">
        <p className="label mb-4">Spending over time</p>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              {/* Faint baseline only — no horizontal gridlines competing with the line. */}
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis hide domain={[0, 'dataMax']} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: 'var(--border)' }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ''}
                formatter={(v: number) => [formatCurrency(v), 'Spent']}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
              />
            </LineChart>
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

      {/* Top merchants as a compact bar chart */}
      {data.topMerchants.length > 0 && (
        <section className="card">
          <p className="label mb-4">Where it went</p>
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.topMerchants}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={86}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'var(--surface-raised)' }}
                  formatter={(v: number) => [formatCurrency(v), 'Spent']}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={14}>
                  {data.topMerchants.map((_, i) => (
                    <Cell key={i} fill="var(--accent)" fillOpacity={1 - i * 0.14} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

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
