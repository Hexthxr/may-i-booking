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
    const books = await Book.find(filter).select('-cover').sort({ createdAt: -1 }).limit(parseInt(limit || '100'));
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public detail (exclude binary; cover via /:id/cover)
router.get('/:id', async (req, res) => {
  try {
    const b = await Book.findById(req.params.id).select('-cover');
    if (!b) return res.status(404).json({ message: 'Not found' });
    res.json(b);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Stream cover image
router.get('/:id/cover', async (req, res) => {
  try {
    const b = await Book.findById(req.params.id).select('cover updatedAt');
    if (!b || !b.cover || !b.cover.data) return res.status(404).send('No cover');
    res.set('Content-Type', b.cover.contentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(b.cover.data);
  } catch (err) {
    res.status(500).send('Error loading cover');
  }
});

// Admin create
router.post('/', requireAuth, requireRole('admin'), upload.single('cover'), async (req, res) => {
  try {
    const payload = JSON.parse(req.body.data || '{}');
    if (!payload.title || !payload.category) return res.status(400).json({ message: 'Missing title/category' });
    if (!ALLOWED_CATEGORIES.includes(payload.category)) return res.status(400).json({ message: 'Invalid category' });
    const book = new Book({ ...payload });
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
    if (req.file && req.file.buffer) {
      update.cover = { data: req.file.buffer, contentType: req.file.mimetype || 'image/jpeg' };
    }
    const book = await Book.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
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
