import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Get dashboard analytics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally calculate from Supabase
    // For now, returning mock data structure
    res.status(200).json({
      totalExpenses: 0,
      totalIncomes: 0,
      netSavings: 0,
      dailyAverage: 0,
      daysElapsed: new Date().getDate(),
      daysInMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get spending by hour
router.get('/spending-by-hour', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally calculate from Supabase
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      amount: 0
    }));

    res.status(200).json(hourlyData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get top merchants
router.get('/top-merchants', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally calculate from Supabase
    res.status(200).json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Detect recurring expenses
router.get('/recurring', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally calculate from Supabase
    res.status(200).json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;