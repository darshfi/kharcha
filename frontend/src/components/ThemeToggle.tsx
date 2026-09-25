import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Animated pill toggle. The knob slides and the track cross-fades, so the
 * change is legible at a glance rather than an abrupt swap.
 */
const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={`relative inline-flex h-7 w-[52px] flex-none items-center rounded-full border border-line
                  transition-colors duration-200 focus:outline-none focus-visible:ring-2
                  focus-visible:ring-accent ${isDark ? 'bg-raised' : 'bg-accent-soft'} ${className}`}
    >
      <span
        className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all duration-200
                    ease-out ${isDark ? 'left-1 bg-accent' : 'left-[27px] bg-accent'}`}
        aria-hidden="true"
      />
      <span className="sr-only">{isDark ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
};

export default ThemeToggle;
