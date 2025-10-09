import { Client as PgClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new PgClient({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

client.connect();

export const query = (text, params) => client.query(text, params);
