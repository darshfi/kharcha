import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Get all categories for a user
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

// Create a new category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, ...categoryData } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate required fields
    if (!categoryData.name || !categoryData.icon || !categoryData.color) {
      return res.status(400).json({ error: 'Name, icon, and color are required' });
    }

    // This would normally use Supabase client from a service
    res.status(201).json({
      id: 'mock-id',
      ...categoryData,
      user_id,
      is_custom: categoryData.is_custom || false,
      is_archived: false,
      order_index: 0,
      created_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific category
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
      name: '',
      icon: '',
      color: '',
      user_id: userId,
      is_custom: false,
      is_archived: false,
      order_index: 0,
      created_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, ...categoryData } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally update in Supabase
    res.status(200).json({
      id,
      ...categoryData,
      user_id,
      updated_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally delete from Supabase
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Archive a category
router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would normally update in Supabase to set is_archived = true
    res.status(200).json({ message: 'Category archived successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;