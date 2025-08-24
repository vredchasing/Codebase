import express from 'express';
import cors from 'cors'; // Import the cors middleware
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));


// Alternatively, enable CORS for specific origins
// app.use(cors({
//   origin: 'http://localhost:3000', // Replace with your frontend's URL
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type'],
// }));

app.use(express.json());
app.use('/api', router);
app.use(errorHandler);

export default app;