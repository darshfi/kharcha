import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Get all budgets for a user
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

// Create a new budget
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, ...budgetData } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate required fields
    if (!budgetData.category_id || !budgetData.monthly_limit || !budgetData.month_year) {
      return res.status(400).json({ error: 'Category ID, monthly limit, and month year are required' });
    }

    // This would normally use Supabase client from a service
    res.status(201).json({
      id: 'mock-id',
      ...budgetData,
      user_id,
      alert_threshold: budgetData.alert_threshold || 0.8,
      created_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific budget
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
      category_id: '',
      monthly_limit: 0,
      alert_threshold: 0.8,
      month_year: '',
      user_id: userId,
      created_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a budget
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, ...budgetData } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally update in Supabase
    res.status(200).json({
      id,
      ...budgetData,
      user_id,
      updated_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a budget
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally delete from Supabase
    res.status(200).json({ message: 'Budget deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget alerts
router.get('/alerts', async (req: Request, res: Response) => {
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