/**
 * Backend Configuration
 * Centralized configuration for the backend
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3000,
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionSuccessStatus: 200,
  },
  database: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
};


