import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Get all incomes for a user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally use Supabase client from a service
    res.status(200).json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new income
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, ...incomeData } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate required fields
    if (!incomeData.amount || !incomeData.source || !incomeData.payment_mode || !incomeData.date) {
      return res.status(400).json({ error: 'Amount, source, payment mode, and date are required' });
    }

    // This would normally use Supabase client from a service
    res.status(201).json({
      id: 'mock-id',
      ...incomeData,
      user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific income
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
      source: '',
      payment_mode: '',
      date: new Date().toISOString().split('T')[0],
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update an income
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, ...incomeData } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally update in Supabase
    res.status(200).json({
      id,
      ...incomeData,
      user_id,
      updated_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an income
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally delete from Supabase
    res.status(200).json({ message: 'Income deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;