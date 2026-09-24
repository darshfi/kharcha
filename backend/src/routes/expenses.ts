import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Get all expenses for a user
router.get('/', async (req: Request, res: Response) => {
  try {
    // In a real app, we would get user_id from JWT token
    // For now, we'll get it from query param (to be replaced with auth middleware)
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally use Supabase client from a service
    // For now, returning mock data structure
    res.status(200).json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new expense
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, ...expenseData } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate required fields
    if (!expenseData.amount || !expenseData.description || !expenseData.category_id || !expenseData.date) {
      return res.status(400).json({ error: 'Amount, description, category, and date are required' });
    }

    // This would normally use Supabase client from a service
    // For now, returning success response
    res.status(201).json({
      id: 'mock-id',
      ...expenseData,
      user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific expense
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally fetch from Supabase
    res.status(200).json({
      id,
      amount: 0,
      description: '',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update an expense
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, ...expenseData } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally update in Supabase
    res.status(200).json({
      id,
      ...expenseData,
      user_id,
      updated_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an expense
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally delete from Supabase
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily stats
router.get('/stats/daily', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally calculate from Supabase
    res.status(200).json({
      date: new Date().toISOString().split('T')[0],
      total: 0,
      count: 0,
      average: 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly stats
router.get('/stats/weekly', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally calculate from Supabase
    res.status(200).json({
      week_start: new Date().toISOString().split('T')[0],
      week_end: new Date().toISOString().split('T')[0],
      total: 0,
      daily_averages: []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly stats
router.get('/stats/monthly', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally calculate from Supabase
    res.status(200).json({
      month: new Date().toISOString().split('T')[0].substring(0, 7),
      total: 0,
      category_breakdown: [],
      daily_averages: []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SMS parsing endpoint
router.post('/sms-parse', async (req: Request, res: Response) => {
  try {
    const { sms_text, user_id } = req.body;

    if (!sms_text || !user_id) {
      return res.status(400).json({ error: 'SMS text and user ID are required' });
    }

    // Simple SMS parsing logic (similar to the HTML prototype)
    const parsed = parseUPISMS(sms_text);

    if (!parsed.amount) {
      return res.status(400).json({ error: 'Could not parse amount from SMS' });
    }

    res.status(200).json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to parse UPI SMS (simplified version)
function parseUPISMS(sms: string): {
  amount: number;
  merchant: string;
  date: string;
  referenceNumber: string;
  transactionType: 'upi';
  isCredit: boolean;
} {
  const s = sms.replace(/\s+/g, ' ').trim();

  // Extract amount
  const amountMatch = s.match(/(?:Rs\.?|INR|₹)\s?([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

  // Check if it's a credit (money received)
  const isCredit = /credited|received/i.test(s) && !/debited|sent|paid|spent/i.test(s);

  // Extract reference number
  const refMatch = s.match(/(?:ref|rrn|utr|txn|upi)[^\d]{0,25}(\d{9,14})/i);
  const referenceNumber = refMatch ? refMatch[1] :
                        (s.match(/\b(\d{12})\b/) ? s.match(/\b(\d{12})\b/)![1] : null);

  // Extract merchant
  let merchant = '';
  const vpaMatch = s.match(/VPA\s+([\w.\-]+@[\w]+)/i);
  if (vpaMatch) {
    merchant = vpaMatch[1].replace(/@.*/, '').trim();
  } else {
    const toMatch = s.match(/(?:\bto|\bat|trf to)\s+([A-Za-z][\w &.'\-]{1,30}?)(?=\s+(?:Ref|on|UPI|via|Avl|Bal|Not|If|-)|[.(]|$)/i);
    merchant = toMatch ? toMatch[1] : '';
  }

  // Extract date
  let date = new Date().toISOString().split('T')[0]; // Default to today
  const dateMatch = s.match(/(\d{1,2})[-\/ ]([A-Za-z]{3})[A-Za-z]*[-\/ ,]*(\d{2,4})/);
  if (dateMatch) {
    const months: { [key: string]: number } = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
    };
    const day = parseInt(dateMatch[1]);
    const month = months[dateMatch[2].toLowerCase()] || 1;
    const year = parseInt(dateMatch[3]) < 100 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3]);
    date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return {
    amount: amount || 0,
    merchant: merchant || 'Unknown',
    date: date,
    referenceNumber: referenceNumber || 'NOT_FOUND',
    transactionType: 'upi',
    isCredit: isCredit
  };
}

export default router;