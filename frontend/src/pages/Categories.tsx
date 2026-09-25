import React, { useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import { useExpenses } from '../context/ExpenseContext';

const PALETTE = [
  '#6C5CE7', '#2ED573', '#FF4757', '#FFA502',
  '#00B8D9', '#FF6B9D', '#A55EEA', '#26DE81',
  '#FDCB6E', '#45AAF2',
];

const Categories: React.FC = () => {
  const { categories, loading, addCategory, deleteCategory, archiveCategory } = useCategories();
  const { expenses } = useExpenses();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [color, setColor] = useState(PALETTE[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the category a name');
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`You already have a "${trimmed}" category`);
      return;
    }

    setBusy(true);
    try {
      await addCategory({ name: trimmed, icon: icon || '🏷️', color, isCustom: true });
      setName('');
      setIcon('🏷️');
    } catch (err: any) {
      setError(err?.message ?? 'Could not create this category');
    } finally {
      setBusy(false);
    }
  };

  // Categories with expenses can't be deleted (FK is ON DELETE RESTRICT);
  // they can be archived instead, which hides them without losing history.
  const inUse = new Set(expenses.map(e => e.categoryId));
  const active = categories.filter(c => !c.isArchived);
  const archived = categories.filter(c => c.isArchived);

  return (
    <div className="stack">
      <header className="pt-2">
        <h1 className="title">Categories</h1>
        <p className="label mt-2">
          {active.length} active{archived.length > 0 && ` · ${archived.length} archived`}
        </p>
      </header>

      <form onSubmit={handleAdd} className="card stack gap-4">
        {error && (
          <div className="rounded-xl border border-negative/30 bg-negative-soft px-4 py-3 text-[13px] text-negative">
            {error}
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={30}
            className="field mt-2"
            placeholder="e.g. Coffee"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="icon">
            Icon
          </label>
          <div className="mt-2 flex items-center gap-3">
            <span className="icon-badge h-11 w-11 text-xl">{icon || '🏷️'}</span>
            <input
              id="icon"
              type="text"
              maxLength={4}
              className="field flex-1"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="Emoji"
            />
          </div>
        </div>

        <div>
          <span className="field-label">Colour</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {PALETTE.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Use colour ${c}`}
                aria-pressed={color === c}
                className={`h-8 w-8 rounded-full border-2 transition-transform duration-150 ${
                  color === c ? 'scale-110 border-fg' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Adding…' : 'Add category'}
        </button>
      </form>

      <section className="card">
        <p className="label mb-3">Your categories</p>

        {loading ? (
          <p className="py-6 text-center text-base text-muted">Loading…</p>
        ) : active.length === 0 ? (
          <p className="py-6 text-center text-base text-muted">Nothing yet</p>
        ) : (
          <div className="-mx-1">
            {active.map(cat => (
              <div
                key={cat.id}
                className="row row-accent mx-1 border-b border-line py-3 pl-3 last:border-0"
                style={{ ['--row-accent' as string]: cat.color }}
              >
                <span className="icon-badge">{cat.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base text-fg">{cat.name}</span>
                  {cat.isCustom && <span className="label mt-1 block">Custom</span>}
                </span>
                {inUse.has(cat.id) ? (
                  <button
                    onClick={() => archiveCategory(cat.id)}
                    className="btn-ghost px-3 py-2 text-[13px]"
                  >
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="btn-ghost px-3 py-2 text-[13px] text-negative"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {archived.length > 0 && (
        <section className="card">
          <p className="label mb-3">Archived</p>
          <div className="-mx-1">
            {archived.map(cat => (
              <div
                key={cat.id}
                className="row mx-1 border-b border-line py-3 pl-3 last:border-0 opacity-50"
              >
                <span className="icon-badge">{cat.icon}</span>
                <span className="flex-1 truncate text-base">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Categories;
