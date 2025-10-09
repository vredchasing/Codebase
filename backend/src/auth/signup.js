// src/auth/signup.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../postgresdb.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Signup body:", req.body);

  try {
    // Check if user already exists
    const { rows } = await query('SELECT * FROM users.users WHERE email = $1', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const newUser = await query(
      'INSERT INTO users.users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword]
    );

    const { id, name: userName, email: userEmail } = newUser.rows[0];

    // Create JWT payload & token
    const payload = { user: { id, name: userName, email: userEmail } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set token in HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    // Return user info
    res.status(201).json({
      msg: 'User registered successfully',
      user: { id, name: userName, email: userEmail }
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).send('Server error');
  }
});

export default router;
