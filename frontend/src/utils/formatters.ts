import { format, parseISO } from 'date-fns';
import { INR } from '../types/currency';

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy');
  } catch (error) {
    return dateString;
  }
};

// Format time
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  try {
    // Assuming timeString is in HH:mm:ss format
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    return timeString;
  }
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Format number with commas
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};