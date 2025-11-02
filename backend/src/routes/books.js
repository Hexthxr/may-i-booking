// import { Router } from 'express';
// import { Book, ALLOWED_CATEGORIES } from '../models/Book.js';
// import { requireAuth } from '../middleware/auth.js';
// import { requireRole } from '../middleware/roles.js';
// import { upload } from '../middleware/upload.js';

// const router = Router();

// // Public list (exclude binary)
// router.get('/', async (req, res) => {
//   try {
//     const { category, q, limit } = req.query;
//     const filter = {};
//     if (category) filter.category = category;
//     if (q) filter.title = { $regex: q, $options: 'i' };
//     const books = await Book.find(filter).select('-cover').sort({ createdAt: -1 }).limit(parseInt(limit || '100'));
//     res.json(books);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Public detail (exclude binary; cover via /:id/cover)
// router.get('/:id', async (req, res) => {
//   try {
//     const b = await Book.findById(req.params.id).select('-cover');
//     if (!b) return res.status(404).json({ message: 'Not found' });
//     res.json(b);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Stream cover image
// router.get('/:id/cover', async (req, res) => {
//   try {
//     const b = await Book.findById(req.params.id).select('cover updatedAt');
//     if (!b || !b.cover || !b.cover.data) return res.status(404).send('No cover');
//     res.set('Content-Type', b.cover.contentType || 'image/jpeg');
//     res.set('Cache-Control', 'public, max-age=86400');
//     return res.send(b.cover.data);
//   } catch (err) {
//     res.status(500).send('Error loading cover');
//   }
// });

// // Admin create
// router.post('/', requireAuth, requireRole('admin'), upload.single('cover'), async (req, res) => {
//   try {
//     const payload = JSON.parse(req.body.data || '{}');
//     if (!payload.title || !payload.category) return res.status(400).json({ message: 'Missing title/category' });
//     if (!ALLOWED_CATEGORIES.includes(payload.category)) return res.status(400).json({ message: 'Invalid category' });
//     const book = new Book({ ...payload });
//     if (req.file && req.file.buffer) {
//       book.cover = { data: req.file.buffer, contentType: req.file.mimetype || 'image/jpeg' };
//     }
//     await book.save();
//     const safe = await Book.findById(book._id).select('-cover');
//     res.status(201).json(safe);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Admin update
// router.put('/:id', requireAuth, requireRole('admin'), upload.single('cover'), async (req, res) => {
//   try {
//     const payload = JSON.parse(req.body.data || '{}');
//     const update = { ...payload };
//     if (req.file && req.file.buffer) {
//       update.cover = { data: req.file.buffer, contentType: req.file.mimetype || 'image/jpeg' };
//     }
//     const book = await Book.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
//     if (!book) return res.status(404).json({ message: 'Not found' });
//     const safe = await Book.findById(book._id).select('-cover');
//     res.json(safe);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Admin delete
// router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
//   try {
//     const book = await Book.findByIdAndDelete(req.params.id);
//     if (!book) return res.status(404).json({ message: 'Not found' });
//     res.json({ message: 'Deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// export default router;

import { Router } from 'express';
import { Book, ALLOWED_CATEGORIES } from '../models/Book.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public list (exclude binary)
router.get('/', async (req, res) => {
  try {
    const { category, q, limit } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) filter.title = { $regex: q, $options: 'i' };
    const books = await Book.find(filter)
      .select('-cover')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit || '100'));
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public get one (exclude binary)
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select('-cover');
    if (!book) return res.status(404).json({ message: 'Not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public cover
router.get('/:id/cover', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select('cover updatedAt');
    if (!book || !book.cover?.data) return res.status(404).end();
    res.setHeader('Content-Type', book.cover.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(book.cover.data);
  } catch (err) { res.status(404).end(); }
});

// Admin create
router.post('/', requireAuth, requireRole('admin'), upload.single('cover'), async (req, res) => {
  try {
    const payload = JSON.parse(req.body.data || '{}');
    const book = new Book({
      sku: payload.sku,
      title: payload.title,
      description: payload.description || '',
      authors: payload.authors || [],
      publisher: payload.publisher || '',
      language: payload.language || 'TH',
      pages: Number(payload.pages || 0),
      year: Number(payload.year || 2025),
      category: payload.category,
      price: Number(payload.price || 0),
      stock: Math.max(0, Number(payload.stock ?? 0)),
      isPreorder: Boolean(payload.isPreorder || false),
    });
    if (req.file && req.file.buffer) {
      book.cover = { data: req.file.buffer, contentType: req.file.mimetype || 'image/jpeg' };
    }
    await book.save();
    const safe = await Book.findById(book._id).select('-cover');
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin update
router.put('/:id', requireAuth, requireRole('admin'), upload.single('cover'), async (req, res) => {
  try {
    const payload = JSON.parse(req.body.data || '{}');
    const update = { ...payload };
    if (typeof update.pages !== 'undefined') update.pages = Number(update.pages || 0);
    if (typeof update.year !== 'undefined') update.year = Number(update.year || 2025);
    if (typeof update.price !== 'undefined') update.price = Math.max(0, Number(update.price || 0));
    if (typeof update.stock !== 'undefined') update.stock = Math.max(0, Number(update.stock || 0));
    if (typeof update.isPreorder !== 'undefined') update.isPreorder = Boolean(update.isPreorder);

    if (req.file && req.file.buffer) {
      update.cover = { data: req.file.buffer, contentType: req.file.mimetype || 'image/jpeg' };
    }
    const book = await Book.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!book) return res.status(404).json({ message: 'Not found' });
    const safe = await Book.findById(book._id).select('-cover');
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin delete
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
