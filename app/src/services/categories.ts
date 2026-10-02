import { supabase } from '../auth/supabase';
import { Category, DEFAULT_CATEGORIES } from '../data/categories';

const fromCategory = (row: any): Category => ({
  id: row.id, name: row.name, symbol: row.icon, color: row.color,
});

export async function loadCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase.from('expense_categories').select('*')
    .eq('user_id', userId).eq('is_archived', false).order('order_index', { ascending: true });
  if (error) throw error;
  if (data?.length) return data.map(fromCategory);

  // Signups without the seeding trigger still need real, persisted UUIDs.
  const { error: seedError } = await supabase.from('expense_categories').upsert(
    DEFAULT_CATEGORIES.map((category, index) => ({
      user_id: userId, name: category.name, icon: category.symbol, color: category.color,
      is_custom: false, order_index: index,
    })), { onConflict: 'user_id,name', ignoreDuplicates: true }
  );
  if (seedError) throw seedError;
  const { data: seeded, error: loadError } = await supabase.from('expense_categories').select('*')
    .eq('user_id', userId).eq('is_archived', false).order('order_index', { ascending: true });
  if (loadError) throw loadError;
  return (seeded ?? []).map(fromCategory);
}

export async function saveCategory(category: Omit<Category, 'id'>, userId: string): Promise<Category> {
  const { data, error } = await supabase.from('expense_categories').insert({
    user_id: userId, name: category.name, icon: category.symbol, color: category.color, is_custom: true,
  }).select().single();
  if (error) throw error;
  return fromCategory(data);
}

export async function removeCategory(id: string, userId: string): Promise<void> {
  // The FK in schema.sql sets existing expenses' category_id to NULL.
  const { error } = await supabase.from('expense_categories').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}
