import { ParsedSMS } from '../types/transaction';
import { isValidDate, localDate } from './dates';

export function parseUPISMS(sms: string): ParsedSMS {
  const s = sms.replace(/\s+/g, ' ').trim();

  const amountMatch = s.match(/(?:Rs\.?|INR|₹)\s?([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

  const isCredit = /credited|received/i.test(s) && !/debited|sent|paid|spent/i.test(s);

  const refMatch = s.match(/(?:ref|rrn|utr|txn|upi)[^\d]{0,25}(\d{9,14})/i);
  const referenceNumber = refMatch
    ? refMatch[1]
    : s.match(/\b(\d{12})\b/)
      ? s.match(/\b(\d{12})\b/)![1]
      : null;

  let merchant = '';
  const vpaMatch = s.match(/VPA\s+([\w.\-]+@[\w]+)/i);
  if (vpaMatch) {
    merchant = vpaMatch[1].replace(/@.*/, '').trim();
  } else {
    const toMatch = s.match(
      /(?:\bto|\bat|trf to)\s+([A-Za-z][\w &.'\-]{1,30}?)(?=\s+(?:Ref|on|UPI|via|Avl|Bal|Not|If|-)|[.(]|$)/i
    );
    merchant = toMatch ? toMatch[1] : '';
  }

  let date = localDate();
  const dateMatch = s.match(/(\d{1,2})[-\/ ]([A-Za-z]{3})[A-Za-z]*[-\/ ,]*(\d{2,4})/);
  if (dateMatch) {
    const months: { [key: string]: number } = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };
    const day = parseInt(dateMatch[1]);
    const month = months[dateMatch[2].toLowerCase()];
    const year = parseInt(dateMatch[3]) < 100 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3]);
    const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (isValidDate(candidate)) date = candidate;
  } else {
    const numericDate = s.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})\b/);
    if (numericDate) {
      const year = Number(numericDate[3]) < 100 ? 2000 + Number(numericDate[3]) : Number(numericDate[3]);
      const candidate = `${year}-${numericDate[2].padStart(2, '0')}-${numericDate[1].padStart(2, '0')}`;
      if (isValidDate(candidate)) date = candidate;
    }
  }

  return {
    amount: amount || 0,
    merchant: merchant || 'Unknown',
    date: date,
    referenceNumber: referenceNumber || 'NOT_FOUND',
    transactionType: 'upi',
    isCredit: isCredit,
  };
}
