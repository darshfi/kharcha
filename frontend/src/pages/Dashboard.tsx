import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useExpenses } from '../context/ExpenseContext';
import { useIncomes } from '../context/IncomeContext';
import { useCategories } from '../context/CategoryContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

const DAY_MS = 86_400_000;

/** Midnight today, local time. */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const Dashboard: React.FC = () => {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { categories } = useCategories();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = monthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = monthKey(lastMonthDate);
    const lastMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const daysElapsed = now.getDate();

    const sumByMonth = (rows: Array<{ amount: number; date: string }>, key: string) =>
      rows.reduce((total, r) => {
        const k = typeof r.date === 'string' ? r.date.slice(0, 7) : key;
        return k === key ? total + Number(r.amount || 0) : total;
      }, 0);

    const monthExpenses = expenses.filter(e => e.date?.slice(0, 7) === thisMonth);
    const monthIncomes = incomes.filter(i => i.date?.slice(0, 7) === thisMonth);

    const totalSpent = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalIncome = monthIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const dailyAverage = daysElapsed > 0 ? totalSpent / daysElapsed : 0;

    const lastTotal = sumByMonth(expenses, lastMonth);
    const lastDailyAverage = lastMonthDays > 0 ? lastTotal / lastMonthDays : 0;
    const trendPct =
      lastDailyAverage > 0 ? ((dailyAverage - lastDailyAverage) / lastDailyAverage) * 100 : null;

    // --- Last 7 days, oldest first ---
    const today = startOfToday();
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today.getTime() - (6 - i) * DAY_MS);
      const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      return {
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: expenses
          .filter(e => e.date === iso)
          .reduce((s, e) => s + Number(e.amount || 0), 0),
      };
    });

    // --- Category breakdown, biggest first ---
    const byCategory = new Map<string, number>();
    monthExpenses.forEach(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      const name = cat?.name ?? 'Uncategorised';
      byCategory.set(name, (byCategory.get(name) ?? 0) + Number(e.amount || 0));
    });
    const breakdown = [...byCategory.entries()]
      .map(([name, amount]) => ({
        name,
        amount,
        icon: categories.find(c => c.name === name)?.icon ?? '•',
        color: categories.find(c => c.name === name)?.color,
      }))
      .sort((a, b) => b.amount - a.amount);
    const maxCategory = breakdown[0]?.amount ?? 0;

    // --- Recent transactions ---
    const recent = [...expenses]
      .sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0))
      .slice(0, 6)
      .map(e => ({
        ...e,
        cat: categories.find(c => c.id === e.categoryId),
      }));

    return {
      totalSpent,
      totalIncome,
      dailyAverage,
      trendPct,
      weekly,
      breakdown,
      maxCategory,
      recent,
      monthLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, [expenses, incomes, categories]);

  const trendUp = (stats.trendPct ?? 0) > 0;
  const hasSpend = stats.totalSpent > 0;

  return (
    <div className="stack">
      {/* ---------- 1. Hero: the month's headline number ---------- */}
      <section className="pt-2">
        <p className="label mb-3">{stats.monthLabel}</p>
        <p className="amount-hero">{formatCurrency(stats.totalSpent)}</p>
        <p className="label mt-2">spent this month</p>
      </section>

      {/* ---------- 2. Daily average + trend ---------- */}
      <section className="row pt-1">
        <div>
          <p className="label">Daily average</p>
          <p className="amount-lg mt-2">{formatCurrency(stats.dailyAverage)}</p>
        </div>
        {stats.trendPct !== null && (
          <div
            className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
              trendUp ? 'bg-negative-soft text-negative' : 'bg-positive-soft text-positive'
            }`}
          >
            {/* Spending less is good — invert the colour semantics. */}
            {trendUp ? '↑' : '↓'} {Math.abs(stats.trendPct).toFixed(0)}% vs last month
          </div>
        )}
      </section>

      <div className="divider" />

      {/* ---------- 3. Weekly line chart ---------- */}
      <section className="card">
        <div className="row mb-4">
          <p className="label">Last 7 days</p>
          <p className="label">
            {formatCurrency(stats.weekly.reduce((s, d) => s + d.amount, 0))}
          </p>
        </div>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.weekly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              {/* No gridlines except a faint baseline — the shape is the signal. */}
              <YAxis hide domain={[0, 'dataMax']} />
              <Tooltip
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                contentStyle={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 13,
                  color: 'var(--text-primary)',
                }}
                labelStyle={{ color: 'var(--text-secondary)' }}
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

      {/* ---------- 4. Category breakdown — horizontal bars ---------- */}
      <section className="card">
        <p className="label mb-4">By category</p>

        {!hasSpend ? (
          <div className="empty">
            <p className="text-base text-muted">No spending this month yet</p>
            <Link to="/add-expense" className="btn-primary mt-2">
              Add an expense
            </Link>
          </div>
        ) : (
          <div className="stack gap-3.5">
            {stats.breakdown.map(cat => (
              <div key={cat.name}>
                <div className="row mb-1.5">
                  <span className="flex items-center gap-2 text-[13px] text-fg">
                    <span className="text-muted">{cat.icon}</span>
                    {cat.name}
                  </span>
                  <span className="amount-md text-[13px]">{formatCurrency(cat.amount)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${(cat.amount / stats.maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- 5. Recent transactions ---------- */}
      <section className="card">
        <div className="row mb-4">
          <p className="label">Recent</p>
          <Link to="/analytics" className="label text-accent transition-colors hover:text-accent-hover">
            See all
          </Link>
        </div>

        {!hasSpend ? (
          <p className="py-6 text-center text-base text-muted">Nothing here yet</p>
        ) : (
          <div className="-mx-1">
            {stats.recent.map(exp => (
              <div
                key={exp.id}
                className="row row-accent mx-1 border-b border-line py-3 pl-3 last:border-0"
                style={{ ['--row-accent' as string]: exp.cat?.color ?? 'var(--accent)' }}
              >
                <span className="icon-badge">{exp.cat?.icon ?? '•'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base text-fg">
                    {exp.description || exp.merchantName || exp.cat?.name || 'Expense'}
                  </span>
                  <span className="label mt-1 block">{formatDate(exp.date)}</span>
                </span>
                <span className="amount-md flex-none">
                  −{formatCurrency(Number(exp.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Income summary ---------- */}
      <section className="row card-raised">
        <span>
          <span className="label block">Income this month</span>
          <span className="amount-lg mt-2 block text-positive">
            {formatCurrency(stats.totalIncome)}
          </span>
        </span>
        <Link to="/add-income" className="btn-secondary">
          Add income
        </Link>
      </section>
    </div>
  );
};

export default Dashboard;
