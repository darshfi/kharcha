export interface Category {
  id: string;
  symbol: string;
  name: string;
  color: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', symbol: 'F', name: 'Food', color: '#F59E0B' },
  { id: 'transport', symbol: 'T', name: 'Transport', color: '#3B82F6' },
  { id: 'health', symbol: 'H', name: 'Health', color: '#EF4444' },
  { id: 'shopping', symbol: 'S', name: 'Shopping', color: '#EC4899' },
  { id: 'rent', symbol: 'R', name: 'Rent & bills', color: '#8B5CF6' },
  { id: 'subscriptions', name: 'Subscriptions', symbol: 'U', color: '#06B6D4' },
  { id: 'entertainment', symbol: 'E', name: 'Entertainment', color: '#10B981' },
  { id: 'travel', symbol: 'V', name: 'Travel', color: '#F97316' },
  { id: 'education', symbol: 'D', name: 'Education', color: '#6366F1' },
  { id: 'gifts', symbol: 'G', name: 'Gifts', color: '#D946EF' },
  { id: 'work', symbol: 'W', name: 'Work', color: '#64748B' },
  { id: 'others', symbol: 'O', name: 'Others', color: '#94A3B8' },
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
