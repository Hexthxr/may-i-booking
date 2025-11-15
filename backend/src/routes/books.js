// backend/src/routes/books.js
import { Router } from 'express';
import { Book } from '../models/Book.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = Router();

/* -----------------------------------------------------------
   Helper: แปลง payload หนังสือจาก body / body.data
----------------------------------------------------------- */
function normalizeBookPayload(body = {}) {
  let payload = body;

  // ถ้ามาจาก FormData แล้วฝัง JSON ไว้ใน field "data"
  if (typeof body.data === 'string') {
    try {
      payload = JSON.parse(body.data);
    } catch {
      throw Object.assign(new Error('Invalid JSON in field "data"'), {
        status: 400,
      });
    }
  }

  const authors = Array.isArray(payload.authors)
    ? payload.authors
    : typeof payload.authors === 'string'
      ? payload.authors
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  return {
    sku: payload.sku?.trim() || undefined,
    title: payload.title?.trim(),
    description: payload.description?.trim() || '',
    authors,
    publisher: payload.publisher?.trim() || '',
    language: payload.language || 'TH',
    pages: Number(payload.pages) || 0,
    year: Number(payload.year) || 2025,
    category: payload.category,
    price: Number(payload.price) || 0,
    stock: Math.max(0, Number(payload.stock) || 0),
    // isHidden ไม่รับจากฟอร์มปกติ (สร้างใหม่ = แสดงเสมอ)
  };
}

/* -----------------------------------------------------------
   1) PUBLIC: list หนังสือ (ไม่รวมเล่มที่ซ่อน)
----------------------------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const { category, q, limit } = req.query;

    const filter = { isHidden: { $ne: true } };
    if (category) filter.category = category;
    if (q) filter.title = { $regex: q, $options: 'i' };

    const books = await Book.find(filter)
      .select('-cover')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit || '100', 10));

    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* -----------------------------------------------------------
   2) PUBLIC: แนะนำ / Top rated (ไม่รวมเล่มที่ซ่อน)
----------------------------------------------------------- */
router.get('/recommended', async (req, res) => {
  try {
    const items = await Book.find({ isHidden: { $ne: true } })
      .select('-cover')
      .sort({ avgRating: -1, ratingCount: -1, createdAt: -1 })
      .limit(8);

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* -----------------------------------------------------------
   3) ADMIN: list หนังสือทั้งหมด (รวมเล่มที่ซ่อน)
----------------------------------------------------------- */
router.get(
  '/admin',
  requireAuth,
  requireRole('admin'),
  async (_req, res) => {
    try {
      const books = await Book.find({})
        .select('-cover')
        .sort({ createdAt: -1 });

      res.json(books);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/* -----------------------------------------------------------
   4) BOOK COVER (ต้องอยู่ก่อน /:id)
----------------------------------------------------------- */
router.get('/:id/cover', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select('cover updatedAt');
    if (!book || !book.cover?.data) return res.status(404).end();

    res.setHeader('Content-Type', book.cover.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(book.cover.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* -----------------------------------------------------------
   5) PUBLIC: ดึงรายละเอียดหนังสือ 1 เล่ม
----------------------------------------------------------- */
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select('-cover');
    if (!book) return res.status(404).json({ message: 'Not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* -----------------------------------------------------------
   6) ADMIN: CREATE book
----------------------------------------------------------- */
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  upload.single('cover'),
  async (req, res) => {
    try {
      const data = normalizeBookPayload(req.body);
      const doc = new Book(data);

      if (req.file) {
        doc.cover = {
          data: req.file.buffer,
          contentType: req.file.mimetype || 'image/jpeg',
        };
      }

      await doc.save();
      res.status(201).json(doc);
    } catch (err) {
      console.error(err);
      if (err.status) {
        return res.status(err.status).json({ message: err.message });
      }
      if (err.name === 'ValidationError') {
        return res
          .status(400)
          .json({ message: 'Validation failed', errors: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  }
);

/* -----------------------------------------------------------
   7) ADMIN: UPDATE book
----------------------------------------------------------- */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  upload.single('cover'),
  async (req, res) => {
    try {
      const data = normalizeBookPayload(req.body);

      const update = { ...data };

      if (req.file) {
        update.cover = {
          data: req.file.buffer,
          contentType: req.file.mimetype || 'image/jpeg',
        };
      }

      const book = await Book.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true,
      });

      if (!book) return res.status(404).json({ message: 'Not found' });
      res.json(book);
    } catch (err) {
      console.error(err);
      if (err.status) {
        return res.status(err.status).json({ message: err.message });
      }
      if (err.name === 'ValidationError') {
        return res
          .status(400)
          .json({ message: 'Validation failed', errors: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  }
);

/* -----------------------------------------------------------
   8) ADMIN: toggle ซ่อน / เลิกซ่อนหนังสือ
   PATCH /api/books/:id/visibility { hidden: true/false }
----------------------------------------------------------- */
router.patch(
  '/:id/visibility',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const hidden = !!req.body.hidden;

      const book = await Book.findByIdAndUpdate(
        req.params.id,
        { $set: { isHidden: hidden } },
        { new: true }
      );

      if (!book) return res.status(404).json({ message: 'Not found' });

      res.json({
        message: hidden
          ? 'ซ่อนหนังสือเล่มนี้เรียบร้อยแล้ว'
          : 'เลิกซ่อนหนังสือเล่มนี้เรียบร้อยแล้ว',
        book,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

/* -----------------------------------------------------------
   9) ADMIN: DELETE (ยังคงไว้ แต่ไม่ใช้ในหน้า admin แล้ว)
   - เผื่อโค้ดส่วนอื่นเคยเรียกอยู่
   - ทำเป็นซ่อนแทนลบจริง
----------------------------------------------------------- */
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const book = await Book.findByIdAndUpdate(
        req.params.id,
        { $set: { isHidden: true } },
        { new: true }
      );

      if (!book) return res.status(404).json({ message: 'Not found' });

      res.json({
        message: 'ซ่อนหนังสือเล่มนี้เรียบร้อยแล้ว',
        book,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
