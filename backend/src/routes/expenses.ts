import { Router } from 'express';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { parseUPISMS } from '../lib/parseUPISMS';

const router = Router();

// SMS parsing endpoint
router.post('/sms-parse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sms_text, user_id } = req.body ?? {};

    if (typeof sms_text !== 'string' || !sms_text.trim() || typeof user_id !== 'string' || !user_id) {
      return res.status(400).json({ error: 'SMS text and user ID are required' });
    }

    // Since we're using authMiddleware, we could also verify if req.user?.id matches user_id
    if (req.user && req.user.id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized: user ID mismatch' });
    }

    // Simple SMS parsing logic (similar to the HTML prototype)
    const parsed = parseUPISMS(sms_text);

    if (!Number.isFinite(parsed.amount) || parsed.amount <= 0) {
      return res.status(400).json({ error: 'Could not parse amount from SMS' });
    }

    res.status(200).json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
