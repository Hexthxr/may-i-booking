import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import authRouter from './routes/auth.js';
import bookRouter from './routes/books.js';
import ordersRouter from './routes/orders.js';
import userRouter from './routes/users.js';
import { UPLOAD_DIR } from './config/paths.js';
import addressesRouter from './routes/addresses.js';
import cartRoute from './routes/cart.js';
import reviewsRouter from './routes/reviews.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: clientOrigin, credentials: true }));

// ให้เสิร์ฟไฟล์ใน uploads ที่ endpoint เดียวกันกับที่เราเซฟ
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes (ทั้งหมดอยู่ใต้ /api)
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', userRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/cart', cartRoute);

// ✅ ต้องเป็น /api/books/:bookId/reviews ให้ตรงกับฝั่ง frontend
app.use('/api/books/:bookId/reviews', reviewsRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'May i Booking API running' });
});

// error handler
app.use((err, req, res, next) => {
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      message: 'ข้อมูลไม่ถูกต้อง',
      errors: Object.fromEntries(
        Object.entries(err.errors || {}).map(([k, v]) => [k, v.message || String(v)])
      )
    });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

connectDB(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('DB connection error:', err.message);
  process.exit(1);
});
export default app;