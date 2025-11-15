// backend/src/server.js
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


// ----- Swagger (ESM version) -----
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

// กำหนด __dirname ใน ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// โหลดไฟล์ YAML (อยู่ใน backend/openapi.yaml)
const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));

// Mount Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ---------- Middlewares ----------
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// CORS: ปล่อยตาม CLIENT_ORIGIN, ถ้าเป็น * = ให้ทุก origin
const clientOrigin = process.env.CLIENT_ORIGIN || '*';
app.use(
  cors({
    origin: clientOrigin === '*' ? true : clientOrigin,
    credentials: true,
  })
);

// ---------- Static uploads (ปกหนังสือ + สลิป) ----------
app.use('/uploads', express.static(UPLOAD_DIR));

// ---------- Routes ----------
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', userRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/cart', cartRoute);
// รีวิวให้ตรงกับ frontend เดิม
app.use('/api/books/:bookId/reviews', reviewsRouter);

// health check เล็ก ๆ
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
      ),
    });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// ---------- Start server ----------
connectDB(process.env.MONGODB_URI)
  .then(() => {
    // ฟังทุก IP ในเครื่องกลาง → ให้เครื่องอื่นใน LAN เรียกได้
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API listening on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB connection error:', err.message);
    process.exit(1);
  });

export default app;
