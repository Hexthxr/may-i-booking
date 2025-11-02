// backend/src/routes/orders.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { Order } from '../models/Order.js';
import { Address } from '../models/Address.js';
import { Book } from '../models/Book.js';
import { calcTotals } from '../utils/orderTotals.js';
import { Cart } from '../models/Cart.js';

const r = Router();

/* ---------- Helpers ---------- */

// รวมสินค้าเข้า Cart (บวกจำนวนกับของเดิม)
async function mergeIntoCart(userId, newItems) {
  // newItems: [{ bookId/ObjectId | book, qty }]
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });

  const map = new Map(cart.items.map(it => [String(it.bookId), Number(it.qty || 1)]));
  for (const it of newItems) {
    const key = String(it.book || it.bookId);
    const addQty = Math.max(1, Number(it.qty || 1));
    map.set(key, (map.get(key) || 0) + addQty);
  }
  cart.items = Array.from(map.entries()).map(([bookId, qty]) => ({ bookId, qty }));
  await cart.save();
  return cart;
}

// enrich items ของ cart เพื่อให้ UI เห็น title/price ล่าสุด
async function enrichItems(items = []) {
  const ids = items.map(it => it.bookId).filter(Boolean);
  const books = await Book.find({ _id: { $in: ids } }).lean();
  const bm = new Map(books.map(b => [String(b._id), b]));
  return items.map(it => {
    const id = String(it.bookId);
    const b = bm.get(id);
    return {
      bookId: id,
      qty: Math.max(1, Number(it.qty || 1)),
      title: b?.title || 'หนังสือ',
      price: b?.price ?? 0,
      stock: b?.stock ?? 0,
      coverUrl: b?.coverUrl || '',
    };
  });
}

/* ---------- Admin zone: วางไว้ก่อนทุกเส้นทางที่ใช้ :id ---------- */

// รวมออเดอร์ทั้งหมด (แอดมินเท่านั้น)
r.get('/admin/all/list', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    // ของเดิมอ้าง filter ที่ไม่ได้ประกาศ -> ใช้ {} แทน
    const list = await Order.find({}).sort({ createdAt: -1 }).lean();
    res.json({ items: list });
  } catch (e) { next(e); }
});

// เปลี่ยนสถานะออเดอร์ (แอดมินเท่านั้น)
r.patch('/admin/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    const { status } = req.body;
    const ok = ['PENDING','PAID','PROCESSING','SHIPPED','COMPLETED','CANCELLED'];
    if (!ok.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const ord = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!ord) return res.status(404).json({ message: 'Order not found' });
    res.json({ order: ord });
  } catch (e) { next(e); }
});

/* ---------- User zone ---------- */

// สร้างออเดอร์
r.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items = [], addressId, note } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items' });
    }

    // validate & ดึงราคาจริงจากหนังสือ (กัน spoof)
    const ids = [];
    for (const i of items) {
      if (!mongoose.isValidObjectId(i.bookId)) {
        return res.status(400).json({ message: 'Invalid bookId' });
      }
      ids.push(new mongoose.Types.ObjectId(i.bookId));
    }
    const books = await Book.find({ _id: { $in: ids } }, { _id: 1, title: 1, price: 1 }).lean();
    const bookMap = new Map(books.map(b => [String(b._id), b]));
    const normItems = items.map(i => {
      const b = bookMap.get(String(i.bookId));
      if (!b) throw new Error('Book not found');
      return {
        bookId: b._id,
        title: b.title,
        price: Number(b.price || 0),
        qty: Math.max(1, Number(i.qty || 1)),
      };
    });

    // snapshot ที่อยู่
    if (!mongoose.isValidObjectId(addressId)) {
      return res.status(400).json({ message: 'Invalid address id' });
    }
    const addr = await Address.findOne({ _id: addressId, userId: req.user.id }).lean();
    if (!addr) return res.status(400).json({ message: 'Address not found' });
    const addressSnap = {
      fullName: addr.fullName, phone: addr.phone,
      line1: addr.line1, line2: addr.line2,
      subdistrict: addr.subdistrict, district: addr.district,
      province: addr.province, postcode: addr.postcode,
    };

    const totals = calcTotals(normItems);
    const order = await Order.create({
      userId: req.user.id,
      items: normItems,
      address: addressSnap,
      note,
      ...totals,
      status: 'PENDING',
      payment: { method: 'COD' },
    });

    res.status(201).json({ order });
  } catch (e) { next(e); }
});

// ลิสต์ออเดอร์ของฉัน
r.get('/', requireAuth, async (req, res, next) => {
  try {
    /* status & search filter (supports TO_SHIP) */
    const { status, q } = req.query || {};
    const filter = {};
    if (status) {
      const s = String(status).toUpperCase();
      if (s === 'TO_SHIP') {
        filter.status = { $in: ['PAID', 'PROCESSING'] };
      } else if (s === 'CANCELLED' || s === 'CANCELED') {
        filter.status = 'CANCELLED';
      } else {
        filter.status = s;
      }
    }
    if (q) {
      // optional text search by title inside items snapshot
      filter['items.title'] = { $regex: String(q), $options: 'i' };
    }
    const list = await Order.find({ ...filter, userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ items: list });
  } catch (e) { next(e); }
});

// ดูออเดอร์ตาม id
r.get('/:id([0-9a-fA-F]{24})', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const ord = await Order.findById(id).lean();
    if (!ord) return res.status(404).json({ message: 'Order not found' });
    if (String(ord.userId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json({ order: ord });
  } catch (e) { next(e); }
});

/* ---------- Cancel items / Cancel order ---------- */

// PATCH /api/orders/:id/cancel-items
r.patch('/:id([0-9a-fA-F]{24})/cancel-items', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [] } = req.body || {};
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isOwner = String(order.userId) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be changed in current status' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items to cancel' });
    }

    // Build map bookId -> cancel qty
    const cancelMap = new Map();
    for (const it of items) {
      if (!it || !it.bookId) continue;
      const key = String(it.bookId);
      const q = Math.max(1, Number(it.qty || 1));
      cancelMap.set(key, (cancelMap.get(key) || 0) + q);
    }

    // Apply cancellations
    let changed = false;
    const beforeItems = order.items.map(it => ({ ...(it.toObject?.() ?? it) }));
    order.items = order.items.map((it) => {
      const key = String(it.bookId);
      if (cancelMap.has(key)) {
        const reduceBy = cancelMap.get(key);
        const newQty = Math.max(0, Number(it.qty) - reduceBy);
        if (newQty !== it.qty) changed = true;
        return { ...(it.toObject?.() ?? it), qty: newQty };
      }
      return it;
    }).filter(it => Number(it.qty) > 0);

    // collect removed items for display
    const removed = [];
    for (const prev of beforeItems) {
      const now = order.items.find(it => String(it.bookId) === String(prev.bookId));
      if (!now) removed.push(prev);
    }
    if (removed.length) {
      order.cancelledItems = [...(order.cancelledItems || []), ...removed];
    }

    if (!changed) return res.status(400).json({ message: 'Nothing to cancel' });

    // Recalculate totals
    const totals = calcTotals(order.items.map(it => ({ price: it.price, qty: it.qty })));
    order.subtotal = totals.subtotal;
    order.shipping = totals.shipping;
    order.discount = totals.discount;
    order.total = totals.total;

    if (order.items.length === 0) {
      order.status = 'CANCELLED';
    }

    await order.save();
    res.json({ order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/orders/:id/cancel
r.patch('/:id([0-9a-fA-F]{24})/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isOwner = String(order.userId) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled now' });
    }
    order.cancelledItems = [...(order.cancelledItems || []), ...order.items.map(it => ({ ...(it.toObject?.() ?? it) }))];
    order.subtotal = 0; order.shipping = 0; order.discount = 0; order.total = 0;
    order.status = 'CANCELLED';
    await order.save();
    res.json({ order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------- Reorder (3 โหมด: checkout / cart / order) ---------- */

// POST /api/orders/:id/reorder
// - body.mode === 'checkout' → คืน { items, mode: 'checkout' } สำหรับไปหน้า /checkout (ไม่แตะ cart, ไม่สร้างออเดอร์ใหม่)
// - body.mode === 'cart'     → นำสินค้ากลับเข้าตะกร้า, คืน { items, warnings, mode: 'cart' }
// - อื่น ๆ (หรือไม่ส่ง)        → สร้างออเดอร์ใหม่จากรายการเดิม, คืน { order, mode: 'order' }
r.post('/:id([0-9a-fA-F]{24})/reorder', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const mode = (req.body?.mode || '').toString();
    const from = await Order.findById(id);
    if (!from) return res.status(404).json({ message: 'Order not found' });

    const isOwner = String(from.userId) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    // ใช้ bookId จาก snapshot เดิมไปเช็คราคา/stock ล่าสุด
    const ids = from.items.map(it => it.bookId).filter(x => mongoose.isValidObjectId(x));
    const books = await Book.find(
      { _id: { $in: ids } },
      { _id: 1, title: 1, price: 1, stock: 1, coverUrl: 1 }
    ).lean();
    const byId = new Map(books.map(b => [String(b._id), b]));

    // ── โหมด checkout: คืนชุด items ที่พร้อมชำระ (ไม่แตะ cart, ไม่สร้าง order)
    // ── โหมด checkout: คืนชุด items ที่พร้อมชำระ (ไม่แตะ cart, ไม่สร้าง order)
if (mode === 'checkout') {
  const warnings = [];
  const items = [];

  for (const it of from.items) {
    const b = byId.get(String(it.bookId));
    if (!b) {
      warnings.push(`"${it.title || it.bookId}" ถูกลบออกจากระบบ`);
      continue;                       // หนังสือหายไปแล้ว → ข้าม
    }
    const stock = Math.max(0, Number(b.stock ?? 0));
    if (stock <= 0) {
      warnings.push(`"${b.title}" สต๊อกหมด`);
      continue;                       // หมดสต๊อก → ไม่ส่งกลับ
    }

    const wantQty = Math.max(1, Number(it.qty || 1));
    const useQty  = Math.min(wantQty, stock); // กัน oversell
    if (useQty < wantQty) {
      warnings.push(`ลดจำนวน "${b.title}" เหลือ ${useQty} ตามสต๊อก`);
    }

    if (useQty > 0) {
      items.push({
        bookId  : String(b._id),
        title   : b.title,
        price   : Number(b.price || 0),
        qty     : useQty,
        coverUrl: b.coverUrl || '',
      });
    }
  }

  if (items.length === 0) {
    return res.status(400).json({ message: 'ไม่มีสินค้าที่พร้อมสั่งซื้อซ้ำ' });
  }
  return res.json({ items, warnings, mode: 'checkout' });
}


    // ── โหมดตะกร้า
    if (mode === 'cart') {
      const warnings = [];
      const toCart = [];
      for (const it of from.items) {
        const b = byId.get(String(it.bookId));
        if (!b) continue; // หนังสือถูกลบไป
        if ((b.stock ?? 0) <= 0) {
          warnings.push(`"${b.title}" สต๊อกหมด เลยไม่นำเข้าในตะกร้า`);
          continue;
        }
        toCart.push({ bookId: b._id, qty: Math.max(1, Number(it.qty || 1)) });
      }
      if (toCart.length === 0) {
        return res.json({ items: [], warnings: warnings.length ? warnings : ['ไม่มีสินค้าที่นำเข้าตะกร้าได้'], mode: 'cart' });
      }
      const cart = await mergeIntoCart(req.user.id, toCart);
      const items = await enrichItems(cart.items);
      return res.json({ items, warnings, mode: 'cart' });
    }

    // ── โหมดสร้างออเดอร์ใหม่ (default)
    const normItems = [];
    for (const it of from.items) {
      const b = byId.get(String(it.bookId));
      if (!b) continue; // book removed -> skip
      normItems.push({
        bookId: b._id,
        title: b.title,
        price: Number(b.price || 0),
        qty: Math.max(1, Number(it.qty || 1)),
      });
    }
    if (normItems.length === 0) {
      return res.status(400).json({ message: 'No available items to reorder' });
    }

    const totals = calcTotals(normItems);
    const order = await Order.create({
      userId: req.user.id,
      items: normItems,
      address: from.address,    // reuse snapshot
      note: (req.body && req.body.note) || `Reorder from ${from._id}`,
      ...totals,
      status: 'PENDING',
      payment: { method: 'COD' },
    });

    res.status(201).json({ order, mode: 'order' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default r;
