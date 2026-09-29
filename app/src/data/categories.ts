export interface Category {
  id: string;
  emoji: string;
  name: string;
  color: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', emoji: '🍔', name: 'Food', color: '#F59E0B' },
  { id: 'transport', emoji: '🚗', name: 'Transport', color: '#3B82F6' },
  { id: 'health', emoji: '🏥', name: 'Health', color: '#EF4444' },
  { id: 'shopping', emoji: '🛍️', name: 'Shopping', color: '#EC4899' },
  { id: 'rent', emoji: '🏠', name: 'Rent & bills', color: '#8B5CF6' },
  { id: 'subscriptions', emoji: '📱', name: 'Subscriptions', color: '#06B6D4' },
  { id: 'entertainment', emoji: '🎮', name: 'Entertainment', color: '#10B981' },
  { id: 'travel', emoji: '✈️', name: 'Travel', color: '#F97316' },
  { id: 'education', emoji: '📚', name: 'Education', color: '#6366F1' },
  { id: 'gifts', emoji: '🎁', name: 'Gifts', color: '#D946EF' },
  { id: 'work', emoji: '💼', name: 'Work', color: '#64748B' },
  { id: 'others', emoji: '📦', name: 'Others', color: '#94A3B8' },
];

const KEYWORD_MAP: Record<string, RegExp> = {
  Food: /swiggy|zomato|restaurant|cafe|dominos|pizza|kitchen|bakery|mart|grocer|blinkit|zepto|bigbasket|chai/i,
  Transport: /uber|ola|rapido|irctc|metro|fuel|petrol|hpcl|bpcl|iocl|fastag/i,
  Subscriptions: /netflix|spotify|hotstar|prime|jio|airtel|vi\b|youtube/i,
  Shopping: /amazon|flipkart|myntra|ajio|meesho/i,
  Health: /pharm|apollo|hospital|clinic|medic/i,
  Entertainment: /bookmyshow|pvr|inox/i,
};

export function guessCategory(merchant: string, smsText: string, categories: Category[]): Category {
  const searchText = `${merchant} ${smsText}`;
  for (const [name, regex] of Object.entries(KEYWORD_MAP)) {
    if (regex.test(searchText)) {
      const cat = categories.find((c) => c.name === name);
      if (cat) return cat;
    }
  }
  return categories.find((c) => c.name === 'Others') || categories[0];
}
