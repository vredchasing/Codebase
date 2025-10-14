import express from 'express';
import { decodeToken} from '../../middleware/authMiddleware.js';
import { query } from '../../../postgresdb.js';

const router = express.Router();

router.get('/get-user-projects', async (req, res) => {
  try {
    const token  = req.cookies.token;
    if(!token) return res.status(401).json({message: 'not valid'})

    const decodedToken = decodeToken(token)
    const userId = decodedToken.user.id

    //query 
    console.log(userId)

    const result = await query(
      `SELECT * FROM projects.project WHERE owner_user_id = $1`, [userId]
    )
    res.json(result.rows)
  }
  catch(error){
    console.log(error)
  }
});

export default router;