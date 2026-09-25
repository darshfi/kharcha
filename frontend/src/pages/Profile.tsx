import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, type Theme } from '../context/ThemeContext';
import { useExpenses } from '../context/ExpenseContext';
import { useIncomes } from '../context/IncomeContext';
import { useCategories } from '../context/CategoryContext';
import { formatCurrency } from '../utils/formatters';
import ThemeToggle from '../components/ThemeToggle';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme, isOverridden, useSystemTheme } = useTheme();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { categories } = useCategories();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
  const name = user?.user_metadata?.full_name || '';
  const initial = (name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="stack">
      <header className="pt-2">
        <h1 className="title">Profile</h1>
      </header>

      <section className="card">
        <div className="row">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base text-fg">{name || 'Your account'}</span>
            <span className="label mt-1 block truncate">{user?.email}</span>
          </span>
        </div>
      </section>

      {/* ---------- Appearance ---------- */}
      <section className="card">
        <p className="label mb-4">Appearance</p>

        <div className="row">
          <span>
            <span className="block text-base text-fg">Dark mode</span>
            <span className="label mt-1 block">
              {isOverridden ? 'Custom' : 'Following your system'}
            </span>
          </span>
          <ThemeToggle />
        </div>

        <div className="divider my-4" />

        <div className="segment">
          {(['light', 'dark'] as Theme[]).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`segment-item ${theme === t ? 'segment-item-active' : ''}`}
            >
              {t === 'light' ? '☀ Light' : '☾ Dark'}
            </button>
          ))}
        </div>

        {isOverridden && (
          <button onClick={useSystemTheme} className="label mt-3 text-accent hover:text-accent-hover">
            Use system setting
          </button>
        )}
      </section>

      {/* ---------- Stats ---------- */}
      <section className="card">
        <p className="label mb-4">All time</p>
        <div className="stack gap-3">
          <div className="row">
            <span className="text-base text-muted">Expenses</span>
            <span className="amount-md">{expenses.length}</span>
          </div>
          <div className="row">
            <span className="text-base text-muted">Income entries</span>
            <span className="amount-md">{incomes.length}</span>
          </div>
          <div className="row">
            <span className="text-base text-muted">Categories</span>
            <span className="amount-md">{categories.filter(c => !c.isArchived).length}</span>
          </div>
          <div className="divider my-1" />
          <div className="row">
            <span className="text-base text-muted">Total spent</span>
            <span className="amount-md text-negative">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="row">
            <span className="text-base text-muted">Total earned</span>
            <span className="amount-md text-positive">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="row">
            <span className="text-base text-fg">Net</span>
            <span
              className={`amount-lg ${totalIncome - totalSpent >= 0 ? 'text-positive' : 'text-negative'}`}
            >
              {formatCurrency(totalIncome - totalSpent)}
            </span>
          </div>
        </div>
      </section>

      <button onClick={handleLogout} className="btn-danger w-full">
        Sign out
      </button>

      <p className="label pb-4 text-center">Ledger · v1.0.0</p>
    </div>
  );
};

export default Profile;
