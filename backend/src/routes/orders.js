// import { Router } from 'express';
// import mongoose from 'mongoose';
// import { requireAuth } from '../middleware/requireAuth.js';
// import { Order } from '../models/Order.js';
// import { Address } from '../models/Address.js';
// import { Book } from '../models/Book.js';
// import { calcTotals } from '../utils/orderTotals.js';
// import { Cart } from '../models/Cart.js';

// const r = Router();

// /* ---------------- Helpers ---------------- */

// // ตรวจ stock และตัดสต๊อกแบบ transaction
// async function checkAndReserveStock(session, items) {
//   const ids = items.map(it => it.bookId);
//   const books = await Book.find({ _id: { $in: ids } }).session(session);
//   const byId = new Map(books.map(b => [String(b._id), b]));
//   for (const it of items) {
//     const b = byId.get(String(it.bookId));
//     if (!b) throw new Error('Book not found');
//     const remain = Number(b.stock || 0);
//     if (remain < it.qty) {
//       const e = new Error(`สต๊อกไม่พอสำหรับ "${b.title}" (เหลือ ${remain} เล่ม, ขอ ${it.qty} เล่ม)`);
//       e.code = 'OUT_OF_STOCK';
//       throw e;
//     }
//   }
//   for (const it of items) {
//     const b = byId.get(String(it.bookId));
//     b.stock = Math.max(0, Number(b.stock || 0) - it.qty);
//     await b.save({ session });
//   }
// }

// // รวมสินค้าออกจาก cart มาสร้าง items (กรณีไม่ส่ง items มา)
// async function itemsFromCart(session, userId) {
//   const cart = await Cart.findOne({ userId }).session(session);
//   if (!cart?.items?.length) return [];
//   const ids = cart.items.map(i => i.bookId);
//   const books = await Book.find({ _id: { $in: ids } }).select('title price').session(session);
//   const map = new Map(books.map(b => [String(b._id), b]));
//   return (cart.items || []).map(i => {
//     const b = map.get(String(i.bookId));
//     if (!b) throw new Error('Book not found');
//     return { bookId: b._id, title: b.title, price: Number(b.price || 0), qty: Math.max(1, Number(i.qty || 1)) };
//   });
// }

// // ทำ snapshot ที่อยู่แบบยืดหยุ่น
// async function resolveAddressSnap(session, userId, body) {
//   const need = ['fullName','phone','line1','subdistrict','district','province','postcode'];

//   // 1) โหมด snapshot ตรงๆ จาก frontend
//   if (body?.shippingAddress) {
//     const s = body.shippingAddress || {};
//     const miss = need.filter(k => !s[k]);
//     if (miss.length) {
//       return { ok:false, status:400, message:'ข้อมูลไม่ถูกต้อง', errors:{ shippingAddress:`missing: ${miss.join(', ')}` } };
//     }
//     return {
//       ok:true,
//       value:{
//         fullName: String(s.fullName),
//         phone: String(s.phone),
//         line1: String(s.line1),
//         line2: String(s.line2 || ''),
//         subdistrict: String(s.subdistrict),
//         district: String(s.district),
//         province: String(s.province),
//         postcode: String(s.postcode),
//       }
//     };
//   }

//   // 2) โหมด addressId
//   const addressId = body?.addressId;
//   if (addressId && mongoose.isValidObjectId(addressId)) {
//     const addr = await Address.findOne({ _id: addressId, userId }).session(session);
//     if (!addr) {
//       return { ok:false, status:404, message:'Address not found' };
//     }
//     return {
//       ok:true,
//       value:{
//         fullName: addr.fullName, phone: addr.phone,
//         line1: addr.line1, line2: addr.line2,
//         subdistrict: addr.subdistrict, district: addr.district,
//         province: addr.province, postcode: addr.postcode,
//       }
//     };
//   }

//   // 3) โหมด fallback: ใช้ default address ของผู้ใช้
//   const def = await Address.findOne({ userId, isDefault: true }).session(session);
//   if (def) {
//     return {
//       ok:true,
//       value:{
//         fullName: def.fullName, phone: def.phone,
//         line1: def.line1, line2: def.line2,
//         subdistrict: def.subdistrict, district: def.district,
//         province: def.province, postcode: def.postcode,
//       }
//     };
//   }

//   return { ok:false, status:400, message:'Invalid address id', errors:{ addressId:'missing or invalid, and no default address' } };
// }

// /* ---------------- Routes ---------------- */

// r.use(requireAuth);

// // สร้างออเดอร์
// r.post('/', async (req, res, next) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const inputItems = Array.isArray(req.body?.items) ? req.body.items : null;

//     // 1) เตรียม items
//     let items = [];
//     if (inputItems?.length) {
//       // validate bookId และ normalize ราคา/ชื่อจาก DB จริง
//       const bad = inputItems.find(i => !i?.bookId || !mongoose.isValidObjectId(i.bookId));
//       if (bad) return res.status(400).json({ message:'Invalid bookId' });

//       const ids = inputItems.map(i => i.bookId);
//       const books = await Book.find({ _id: { $in: ids } }).select('title price').session(session);
//       const map = new Map(books.map(b => [String(b._id), b]));
//       items = inputItems.map(i => {
//         const b = map.get(String(i.bookId));
//         if (!b) throw new Error('Book not found');
//         return { bookId: b._id, title: b.title, price: Number(b.price || 0), qty: Math.max(1, Number(i.qty || 1)) };
//       });
//     } else {
//       items = await itemsFromCart(session, req.user.id);
//     }

//     if (!items.length) return res.status(400).json({ message: 'ไม่มีสินค้าในออร์เดอร์' });

//     // 2) snapshot ที่อยู่ (ยืดหยุ่น)
//     const adr = await resolveAddressSnap(session, req.user.id, req.body || {});
//     if (!adr.ok) {
//       await session.abortTransaction();
//       return res.status(adr.status).json({ message: adr.message, errors: adr.errors });
//     }

//     // 3) ตรวจ & ตัด stock
//     await checkAndReserveStock(session, items);

//     // 4) คำนวณยอด
//     const totals = calcTotals(items);

//     // 5) payment
//     const payMethod = (req.body?.paymentMethod && String(req.body.paymentMethod)) || 'COD';

//     // 6) สร้างออเดอร์  **สถานะเริ่มต้นต้องอยู่ใน enum เดิมของโปรเจกต์**
//     const [order] = await Order.create([{
//       userId: req.user.id,
//       items,
//       address: adr.value,
//       status: 'PENDING',               // ⬅⬅ เปลี่ยนจาก 'TO_SHIP' เป็น 'PENDING'
//       payment: { method: payMethod },
//       ...totals
//     }], { session });

//     // 7) เคลียร์ตะกร้า
//     await Cart.findOneAndUpdate({ userId: req.user.id }, { $set: { items: [] } }).session(session);

//     await session.commitTransaction();
//     res.status(201).json(order);
//   } catch (e) {
//     await session.abortTransaction();
//     if (e.code === 'OUT_OF_STOCK') {
//       return res.status(409).json({ message: e.message, code: e.code });
//     }
//     next(e);
//   } finally {
//     session.endSession();
//   }
// });

// // ลิสต์ออเดอร์ของฉัน (ย่อ)
// r.get('/', async (req, res, next) => {
//   try {
//     const list = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
//     res.json(list);
//   } catch (e) { next(e); }
// });

// export default r;

import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { Order } from '../models/Order.js';
import { Address } from '../models/Address.js';
import { Book } from '../models/Book.js';
import { Cart } from '../models/Cart.js';
import { calcTotals } from '../utils/orderTotals.js';

const r = Router();

/* ---------------- Helpers ---------------- */

// ตรวจ stock และตัดสต๊อกแบบ transaction
async function checkAndReserveStock(session, items) {
  const ids = items.map(it => it.bookId);
  const books = await Book.find({ _id: { $in: ids } }).session(session);
  const byId = new Map(books.map(b => [String(b._id), b]));
  for (const it of items) {
    const b = byId.get(String(it.bookId));
    if (!b) throw new Error('Book not found');
    const remain = Number(b.stock || 0);
    if (remain < it.qty) {
      const e = new Error(`สต๊อกไม่พอสำหรับ "${b.title}" (เหลือ ${remain} เล่ม, ขอ ${it.qty} เล่ม)`);
      e.code = 'OUT_OF_STOCK';
      throw e;
    }
  }
  for (const it of items) {
    const b = byId.get(String(it.bookId));
    b.stock = Math.max(0, Number(b.stock || 0) - it.qty);
    await b.save({ session });
  }
}

// รวมสินค้าออกจาก cart มาสร้าง items (กรณีไม่ส่ง items มา)
async function itemsFromCart(session, userId) {
  const cart = await Cart.findOne({ userId }).session(session);
  if (!cart?.items?.length) return [];
  const ids = cart.items.map(i => i.bookId);
  const books = await Book.find({ _id: { $in: ids } }).select('title price').session(session);
  const map = new Map(books.map(b => [String(b._id), b]));
  return (cart.items || []).map(i => {
    const b = map.get(String(i.bookId));
    if (!b) throw new Error('Book not found');
    return { bookId: b._id, title: b.title, price: Number(b.price || 0), qty: Math.max(1, Number(i.qty || 1)) };
  });
}

// ทำ snapshot ที่อยู่แบบยืดหยุ่น: shippingAddress ⇒ addressId ⇒ default address
async function resolveAddressSnap(session, userId, body) {
  const need = ['fullName','phone','line1','subdistrict','district','province','postcode'];

  // 1) โหมด snapshot ตรงๆ จาก frontend
  if (body?.shippingAddress) {
    const s = body.shippingAddress || {};
    const miss = need.filter(k => !s[k]);
    if (miss.length) {
      return { ok:false, status:400, message:'ข้อมูลไม่ถูกต้อง', errors:{ shippingAddress:`missing: ${miss.join(', ')}` } };
    }
    return {
      ok:true,
      value:{
        fullName: String(s.fullName),
        phone: String(s.phone),
        line1: String(s.line1),
        line2: String(s.line2 || ''),
        subdistrict: String(s.subdistrict),
        district: String(s.district),
        province: String(s.province),
        postcode: String(s.postcode),
      }
    };
  }

  // 2) โหมด addressId
  const addressId = body?.addressId;
  if (addressId && mongoose.isValidObjectId(addressId)) {
    const addr = await Address.findOne({ _id: addressId, userId }).session(session);
    if (!addr) return { ok:false, status:404, message:'Address not found' };
    return {
      ok:true,
      value:{
        fullName: addr.fullName, phone: addr.phone,
        line1: addr.line1, line2: addr.line2,
        subdistrict: addr.subdistrict, district: addr.district,
        province: addr.province, postcode: addr.postcode,
      }
    };
  }

  // 3) โหมด fallback: ใช้ default address ของผู้ใช้
  const def = await Address.findOne({ userId, isDefault: true }).session(session);
  if (def) {
    return {
      ok:true,
      value:{
        fullName: def.fullName, phone: def.phone,
        line1: def.line1, line2: def.line2,
        subdistrict: def.subdistrict, district: def.district,
        province: def.province, postcode: def.postcode,
      }
    };
  }

  return { ok:false, status:400, message:'Invalid address id', errors:{ addressId:'missing or invalid, and no default address' } };
}

/* ---------------- Routes ---------------- */

r.use(requireAuth);

/** สร้างออเดอร์ */
r.post('/', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const inputItems = Array.isArray(req.body?.items) ? req.body.items : null;

    // 1) เตรียม items
    let items = [];
    if (inputItems?.length) {
      // validate bookId และ normalize ราคา/ชื่อจาก DB จริง
      const bad = inputItems.find(i => !i?.bookId || !mongoose.isValidObjectId(i.bookId));
      if (bad) return res.status(400).json({ message:'Invalid bookId' });

      const ids = inputItems.map(i => i.bookId);
      const books = await Book.find({ _id: { $in: ids } }).select('title price').session(session);
      const map = new Map(books.map(b => [String(b._id), b]));
      items = inputItems.map(i => {
        const b = map.get(String(i.bookId));
        if (!b) throw new Error('Book not found');
        return { bookId: b._id, title: b.title, price: Number(b.price || 0), qty: Math.max(1, Number(i.qty || 1)) };
      });
    } else {
      items = await itemsFromCart(session, req.user.id);
    }

    if (!items.length) return res.status(400).json({ message: 'ไม่มีสินค้าในออร์เดอร์' });

    // 2) snapshot ที่อยู่ (ยืดหยุ่น)
    const adr = await resolveAddressSnap(session, req.user.id, req.body || {});
    if (!adr.ok) {
      await session.abortTransaction();
      return res.status(adr.status).json({ message: adr.message, errors: adr.errors });
    }

    // 3) ตรวจ & ตัด stock
    await checkAndReserveStock(session, items);

    // 4) คำนวณยอด
    const totals = calcTotals(items);

    // 5) payment
    const payMethod = (req.body?.paymentMethod && String(req.body.paymentMethod)) || 'COD';

    // 6) สร้างออเดอร์ (สถานะตาม enum ดั้งเดิม)
    const [order] = await Order.create([{
      userId: req.user.id,
      items,
      address: adr.value,
      status: 'PENDING',
      payment: { method: payMethod },
      ...totals
    }], { session });

    // 7) เคลียร์ตะกร้า
    await Cart.findOneAndUpdate({ userId: req.user.id }, { $set: { items: [] } }).session(session);

    await session.commitTransaction();
    res.status(201).json({ order });
  } catch (e) {
    await session.abortTransaction();
    if (e.code === 'OUT_OF_STOCK') {
      return res.status(409).json({ message: e.message, code: e.code });
    }
    next(e);
  } finally {
    session.endSession();
  }
});

/** ลิสต์ออเดอร์ของฉัน -> ส่ง { items:[...] } ให้ฟรอนต์อ่านง่าย */
r.get('/', async (req, res, next) => {
  try {
    const list = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ items: list });
  } catch (e) { next(e); }
});

/** รายละเอียดออเดอร์ตาม id (ต้องเป็นของตัวเองหรือแอดมิน) */
r.get('/:id([0-9a-fA-F]{24})', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ord = await Order.findById(id).lean();
    if (!ord) return res.status(404).json({ message: 'Order not found' });

    const isOwner = String(ord.userId) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    res.json({ order: ord });
  } catch (e) { next(e); }
});

/** ยกเลิกบางรายการ */
r.patch('/:id([0-9a-fA-F]{24})/cancel-items', async (req, res) => {
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

    const cancelMap = new Map();
    for (const it of items) {
      if (!it || !it.bookId) continue;
      const key = String(it.bookId);
      const q = Math.max(1, Number(it.qty || 1));
      cancelMap.set(key, (cancelMap.get(key) || 0) + q);
    }

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

    const removed = [];
    for (const prev of beforeItems) {
      const now = order.items.find(it => String(it.bookId) === String(prev.bookId));
      if (!now) removed.push(prev);
    }
    if (removed.length) {
      order.cancelledItems = [...(order.cancelledItems || []), ...removed];
    }

    if (!changed) return res.status(400).json({ message: 'Nothing to cancel' });

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

/** ยกเลิกทั้งออเดอร์ */
r.patch('/:id([0-9a-fA-F]{24})/cancel', async (req, res) => {
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

/** Reorder: mode=checkout → คืน items + warnings เพื่อไปหน้า Checkout ทันที */
r.post('/:id([0-9a-fA-F]{24})/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const mode = (req.body?.mode || '').toString();
    const from = await Order.findById(id);
    if (!from) return res.status(404).json({ message: 'Order not found' });

    const isOwner = String(from.userId) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    const ids = from.items.map(it => it.bookId).filter(x => mongoose.isValidObjectId(x));
    const books = await Book.find(
      { _id: { $in: ids } },
      { _id: 1, title: 1, price: 1, stock: 1, coverUrl: 1 }
    ).lean();
    const byId = new Map(books.map(b => [String(b._id), b]));

    if (mode === 'checkout') {
      const warnings = [];
      const items = [];

      for (const it of from.items) {
        const b = byId.get(String(it.bookId));
        if (!b) { warnings.push(`"${it.title || it.bookId}" ถูกลบออกจากระบบ`); continue; }
        const stock = Math.max(0, Number(b.stock ?? 0));
        if (stock <= 0) { warnings.push(`"${b.title}" สต๊อกหมด`); continue; }

        const wantQty = Math.max(1, Number(it.qty || 1));
        const useQty  = Math.min(wantQty, stock);
        if (useQty < wantQty) warnings.push(`ลดจำนวน "${b.title}" เหลือ ${useQty} ตามสต๊อก`);

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

    // โหมดอื่น ๆ (ถ้าต้องการเพิ่มภายหลัง)
    return res.status(400).json({ message: 'Unsupported reorder mode' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default r;
