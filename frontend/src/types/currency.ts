export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

export const DATE_FORMATS = [
  { format: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { format: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { format: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface DateFormat {
  format: string;
  label: string;
}