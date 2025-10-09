import express from 'express';
import cors from 'cors';
import signUpRouter from './src/auth/signup.js';
import loginRouter from './src/auth/login.js';
import getUserRouter from './src/auth/getUser.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
dotenv.config();
app.use(cookieParser());
const corsOptions ={
    origin:'http://localhost:5173', 
    credentials:true,
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

// mount your auth routes (assuming prefix /api/auth)
app.use('/api/auth', signUpRouter);
app.use('/api/auth', loginRouter);
app.use('/api/auth', getUserRouter);

console.log(process.env.DB_PASSWORD);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
