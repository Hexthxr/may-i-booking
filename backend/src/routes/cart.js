
// backend/src/routes/cart.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/requireAuth.js';
import { Cart } from '../models/Cart.js';
import { Book } from '../models/Book.js';

const r = Router();
r.use(requireAuth);

/** Helper: enrich cart items with latest book data (title, price, stock).
 * Always returns plain array: [{bookId, qty, title, price, stock}]
 */
async function enrichItems(items = []) {
  const ids = items.map(it => it.bookId).filter(Boolean);
  const books = await Book.find({ _id: { $in: ids } }).lean();
  const map = new Map(books.map(b => [String(b._id), b]));
  return (items || []).map(it => {
    const b = map.get(String(it.bookId));
    return {
      bookId: it.bookId,
      qty: Math.max(1, Number(it.qty || 1)),
      title: b?.title || it.title || '',
      price: Number(b?.price ?? it.price ?? 0),
      stock: Number(b?.stock ?? 0),
      coverUrl: it.coverUrl || ''
    };
  });
}

// GET /api/cart
r.get('/', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    const items = await enrichItems(cart?.items || []);
    res.json(items);
  } catch (e) { next(e); }
});

// Helper to clamp qty to stock (0 stock -> cannot add)
function clampToStock(qty, stock) {
  const q = Math.max(1, Number(qty)||1);
  const s = Math.max(0, Number(stock)||0);
  if (s === 0) return 0;
  return Math.min(q, s);
}

// POST /api/cart/items  { items:[{bookId, qty}] }
r.post('/items', async (req, res, next) => {
  try {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const ids = rawItems.map(i => i.bookId).filter(Boolean);
    const books = await Book.find({ _id: { $in: ids } }).select('stock title price').lean();
    const bmap = new Map(books.map(b => [String(b._id), b]));

    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $setOnInsert: { userId: req.user.id, items: [] } },
      { upsert: true, new: true }
    );

    // merge/add respecting stock
    const merged = new Map((cart.items || []).map(it => [String(it.bookId), { ...it.toObject?.() || it }]));
    for (const it of rawItems) {
      const k = String(it.bookId);
      const meta = bmap.get(k);
      if (!meta) continue;
      const want = Math.max(1, Number(it.qty)||1);
      const current = merged.get(k)?.qty || 0;
      const max = clampToStock(want + current, meta.stock);
      if (max === 0) continue; // out of stock, skip
      merged.set(k, { bookId: it.bookId, qty: max });
    }
    cart.items = Array.from(merged.values());
    await cart.save();
    const items = await enrichItems(cart.items);
    res.json(items);
  } catch (e) { next(e); }
});

// PUT /api/cart/qty  { bookId, qty }
r.put('/qty', async (req, res, next) => {
  try {
    const { bookId, qty } = req.body || {};
    const b = await Book.findById(bookId).select('stock').lean();
    if (!b) return res.status(404).json({ message: 'Book not found' });
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.json([]);
    const s = Number(b.stock||0);
    const v = clampToStock(qty, s);
    if (v === 0) {
      // remove item if no stock
      cart.items = (cart.items || []).filter(it => String(it.bookId) !== String(bookId));
    } else {
      cart.items = (cart.items || []).map(it => String(it.bookId) === String(bookId) ? ({ ...it.toObject?.()||it, qty: v }) : it);
    }
    await cart.save();
    const items = await enrichItems(cart.items);
    res.json(items);
  } catch (e) { next(e); }
});

// DELETE /api/cart/items  { ids: [] }
r.delete('/items', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.json([]);
    cart.items = (cart.items || []).filter(it => !ids.includes(String(it.bookId)));
    await cart.save();
    const items = await enrichItems(cart.items);
    res.json(items);
  } catch (e) { next(e); }
});

// DELETE /api/cart  → clear all
r.delete('/', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.json({ items: [] });
    cart.items = [];
    await cart.save();
    res.json({ items: [] });
  } catch (e) { next(e); }
});

export default r;
