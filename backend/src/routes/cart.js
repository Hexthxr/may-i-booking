// backend/src/routes/cart.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/requireAuth.js';
import { Cart } from '../models/Cart.js';
import { Book } from '../models/Book.js';

const r = Router();
r.use(requireAuth);

/** Helper: enrich cart items with latest book data (title, price).
 * Always returns plain array: [{bookId, qty, title, price}]
 */
async function enrichItems(items = []) {
  const ids = items.map(it => it.bookId).filter(Boolean);
  const books = await Book.find({ _id: { $in: ids } }).lean();
  const map = new Map(books.map(b => [String(b._id), b]));
  return items.map(it => {
    const id = String(it.bookId);
    const b = map.get(id);
    return {
      bookId: id,
      qty: Math.max(1, Number(it.qty || 1)),
      title: it.title || b?.title || 'หนังสือ',
      price: typeof it.price === 'number' ? it.price : (b?.price ?? 0),
    };
  });
}

// GET /api/cart  → enriched items (include latest title/price)
r.get('/', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).lean();
    const items = await enrichItems(cart?.items || []);
    res.json({ items });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// ADD: รองรับทั้ง POST /api/cart และ POST /api/cart/items
// ทั้งคู่ merge { items:[{bookId, qty}] } เข้าตะกร้า
async function handleMerge(req, res, next){
  try {
    const payload = Array.isArray(req.body?.items) ? req.body.items : [];
    const normalized = payload
      .map(x => ({
        bookId: mongoose.isValidObjectId(x.bookId) ? x.bookId : String(x.bookId || '').trim(),
        qty: Math.max(1, Number(x.qty || 1)),
      }))
      .filter(x => mongoose.isValidObjectId(x.bookId));

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }

    const map = new Map(cart.items.map(it => [String(it.bookId), Number(it.qty || 1)]));
    for (const it of normalized) {
      const key = String(it.bookId);
      map.set(key, (map.get(key) || 0) + it.qty);
    }
    cart.items = Array.from(map.entries()).map(([bookId, qty]) => ({ bookId, qty }));
    await cart.save();

    const items = await enrichItems(cart.items);
    res.json({ items });
  } catch (e) { next(e); }
}
r.post('/', handleMerge);
r.post('/items', handleMerge); // ← alias ที่เพิ่มเข้ามา

// PUT /api/cart/qty  → set quantity for a book { bookId, qty }
r.put('/qty', async (req, res, next) => {
  try {
    const { bookId, qty } = req.body || {};
    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({ message: 'invalid bookId' });
    }
    const v = Math.max(1, Number(qty) || 1);
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.json({ items: [] });
    const idx = cart.items.findIndex(it => String(it.bookId) === String(bookId));
    if (idx >= 0) cart.items[idx].qty = v;
    await cart.save();
    const items = await enrichItems(cart.items);
    res.json({ items });
  } catch (e) { next(e); }
});

// DELETE /api/cart/items  → remove list of book ids
// รองรับทั้ง:
//   - query: ?ids=AAA&ids=BBB หรือ ?id=AAA
//   - body : { ids:[], bookIds:[], id, bookId } (รองรับ axios.delete(url, { data: {...} }))
r.delete('/items', async (req, res, next) => {
  try {
    const qIds = []
      .concat(req.query?.ids ?? [])
      .concat(req.query?.id ?? []);
    const bIds = []
      .concat(req.body?.ids ?? [])
      .concat(req.body?.bookIds ?? [])
      .concat(req.body?.id ?? [])
      .concat(req.body?.bookId ?? []);

    const mixed = []
      .concat(qIds)
      .concat(bIds)
      .flat()
      .filter(Boolean);

    const ids = mixed
      .map(x => (mongoose.isValidObjectId(x) ? String(x) : null))
      .filter(Boolean);

    if (!ids.length) {
      return res.status(400).json({ message: 'No ids' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.json({ items: [] });

    const idSet = new Set(ids);
    cart.items = (cart.items || []).filter(it => !idSet.has(String(it.bookId)));
    await cart.save();

    const items = await enrichItems(cart.items);
    res.json({ items });
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
