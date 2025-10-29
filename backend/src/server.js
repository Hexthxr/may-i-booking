
// import express from 'express';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import { fileURLToPath } from 'url';

// import { connectDB } from './config/db.js';
// import authRouter from './routes/auth.js';
// import bookRouter from './routes/books.js';
// import { UPLOAD_DIR } from './config/paths.js';  // ใช้ path เดียวกัน

// dotenv.config();
// const app = express();

// const PORT = process.env.PORT || 4000;

// app.use(helmet());
// app.use(morgan('dev'));
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
// app.use(cors({
//   origin: clientOrigin,
//   credentials: true
// }));

// // Static for uploads
// app.use('/uploads', express.static(UPLOAD_DIR));

// // Routes
// app.use('/api/auth', authRouter);
// app.use('/api/books', bookRouter);

// app.get('/', (req, res) => {
//   res.json({ status: 'ok', message: 'May i Booking API running' });
// });

// // Start
// connectDB(process.env.MONGODB_URI).then(() => {
//   app.listen(PORT, () => {
//     console.log(`API listening on http://localhost:${PORT}`);
//   });
// }).catch((err) => {
//   console.error('DB connection error:', err.message);
//   process.exit(1);
// });

// backend/src/server.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import authRouter from './routes/auth.js';
import bookRouter from './routes/books.js';
import { UPLOAD_DIR } from './config/paths.js';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 4000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: clientOrigin,
  credentials: true
}));

// ให้เสิร์ฟไฟล์ใน uploads ที่ endpoint เดียวกันกับที่เราเซฟ
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'May i Booking API running' });
});

connectDB(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('DB connection error:', err.message);
  process.exit(1);
});
