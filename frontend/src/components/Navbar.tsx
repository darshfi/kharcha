import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/add-expense', label: 'Add', end: false },
  { to: '/analytics', label: 'Charts', end: false },
  { to: '/categories', label: 'Categories', end: false },
  { to: '/budgets', label: 'Budgets', end: false },
];

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
      isActive ? 'text-fg' : 'text-muted hover:text-fg'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="shell flex items-center gap-3 py-3">
        <NavLink to="/" className="mr-auto flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-on-accent">
            L
          </span>
          <span className="text-base font-semibold tracking-tight text-fg">Ledger</span>
        </NavLink>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `hidden px-3 py-2 text-[13px] font-medium transition-colors duration-150 sm:block ${
                isActive ? 'text-fg' : 'text-muted hover:text-fg'
              }`
            }
          >
            Profile
          </NavLink>

          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-fg sm:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              {open ? (
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-line bg-surface sm:hidden">
          <nav className="shell flex flex-col py-2">
            {[...LINKS, { to: '/add-income', label: 'Add Income', end: false }, { to: '/profile', label: 'Profile', end: false }].map(
              link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-3 text-base transition-colors ${
                      isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-raised hover:text-fg'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ),
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="mt-1 rounded-lg px-3 py-3 text-left text-base text-negative transition-colors hover:bg-negative-soft"
            >
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
