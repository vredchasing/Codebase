import express from 'express';
import { query } from '../../postgresdb.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/getUser', verifyToken, async (req, res) => {
  try {
    // Assuming the user ID is stored in the JWT payload
    const userId = req.user.id;

    // Query the database for the user's information
    const { rows } = await query('SELECT id, name, email FROM users.users WHERE id = $1', [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const user = rows[0];
    res.json({ user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
