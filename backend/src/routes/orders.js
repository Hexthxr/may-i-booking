// backend/src/routes/orders.js
import { Router } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

import { requireAuth } from '../middleware/requireAuth.js';
import { upload } from '../middleware/upload.js';
import { UPLOAD_DIR } from '../config/paths.js';

import { Order } from '../models/Order.js';
import { Address } from '../models/Address.js';
import { Book } from '../models/Book.js';
import { Cart } from '../models/Cart.js';
import { User } from '../models/User.js';
import { calcTotals } from '../utils/orderTotals.js';

const router = Router();

// โฟลเดอร์เก็บไฟล์ uploads (เช่น covers, slips ฯลฯ)
const SLIP_DIR = path.join(UPLOAD_DIR, 'slips');
if (!fs.existsSync(SLIP_DIR)) {
  fs.mkdirSync(SLIP_DIR, { recursive: true });
}

/* ---------------- Helpers ---------------- */

async function checkAndReserveStock(session, items) {
  const ids = items.map((it) => it.bookId);
  const books = await Book.find({ _id: { $in: ids } }).session(session);
  const byId = new Map(books.map((b) => [String(b._id), b]));

  for (const it of items) {
    const b = byId.get(String(it.bookId));
    if (!b) throw new Error('Book not found');

    const remain = Number(b.stock || 0);
    if (remain < it.qty) {
      const err = new Error(`สต๊อกไม่พอสำหรับ "${b.title}" (เหลือ ${remain} เล่ม)`);
      err.code = 'OUT_OF_STOCK';
      throw err;
    }
  }

  for (const it of items) {
    await Book.updateOne(
      { _id: it.bookId },
      { $inc: { stock: -it.qty } }
    ).session(session);
  }
}

async function itemsFromCart(session, userId) {
  const cart = await Cart.findOne({ userId }).session(session);
  if (!cart?.items?.length) return [];
  const ids = cart.items.map((i) => i.bookId);
  const books = await Book.find({ _id: { $in: ids } })
    .select('title price')
    .session(session);
  const map = new Map(books.map((b) => [String(b._id), b]));

  return (cart.items || []).map((i) => {
    const b = map.get(String(i.bookId));
    if (!b) throw new Error('Book not found');
    return {
      bookId: b._id,
      title: b.title,
      price: Number(b.price || 0),
      qty: Math.max(1, Number(i.qty || 1)),
    };
  });
}

async function resolveAddressSnap(session, userId, body) {
  const need = ['fullName', 'phone', 'line1', 'subdistrict', 'district', 'province', 'postcode'];

  // 1) shippingAddress
  if (body?.shippingAddress) {
    let s = body.shippingAddress;
    if (typeof s === 'string') {
      try {
        s = JSON.parse(s);
      } catch {
        return {
          ok: false,
          status: 400,
          message: 'ข้อมูลไม่ถูกต้อง',
          errors: { shippingAddress: 'invalid JSON' },
        };
      }
    }
    const miss = need.filter((k) => !s[k]);
    if (miss.length) {
      return {
        ok: false,
        status: 400,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: { shippingAddress: `missing: ${miss.join(', ')}` },
      };
    }
    return {
      ok: true,
      value: {
        fullName: String(s.fullName),
        phone: String(s.phone),
        line1: String(s.line1),
        line2: s.line2 || '',
        subdistrict: String(s.subdistrict),
        district: String(s.district),
        province: String(s.province),
        postcode: String(s.postcode),
      },
    };
  }

  // 2) addressId
  if (body?.addressId && mongoose.isValidObjectId(body.addressId)) {
    const adr = await Address.findOne({ _id: body.addressId, userId }).session(session);
    if (!adr) {
      return {
        ok: false,
        status: 400,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: { addressId: 'not found for this user' },
      };
    }
    return {
      ok: true,
      value: {
        fullName: adr.fullName,
        phone: adr.phone,
        line1: adr.line1,
        line2: adr.line2,
        subdistrict: adr.subdistrict,
        district: adr.district,
        province: adr.province,
        postcode: adr.postcode,
      },
    };
  }

  // 3) default address
  const def = await Address.findOne({ userId, isDefault: true }).session(session);
  if (def) {
    return {
      ok: true,
      value: {
        fullName: def.fullName,
        phone: def.phone,
        line1: def.line1,
        line2: def.line2,
        subdistrict: def.subdistrict,
        district: def.district,
        province: def.province,
        postcode: def.postcode,
      },
    };
  }

  return {
    ok: false,
    status: 400,
    message: 'ข้อมูลไม่ถูกต้อง',
    errors: { addressId: 'missing or invalid, and no default address' },
  };
}

/* ---------------- Routes ---------------- */

router.use(requireAuth);

/**
 * POST /api/orders
 * รองรับ:
 *  - JSON ธรรมดา (COD)
 *  - multipart/form-data พร้อม field ชื่อ "slip"
 *  - หรือ front ส่ง path สลิปมาเองใน body: slipUrl/slipPath/slip
 */
router.post('/', upload.single('slip'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 1) items
    let inputItems = null;
    const rawItems = req.body?.items;

    if (Array.isArray(rawItems)) {
      inputItems = rawItems;
    } else if (typeof rawItems === 'string' && rawItems.trim()) {
      try {
        inputItems = JSON.parse(rawItems);
      } catch {
        return res.status(400).json({ message: 'Invalid items JSON' });
      }
    }

    let items = [];
    if (inputItems?.length) {
      const bad = inputItems.find((i) => !i?.bookId || !mongoose.isValidObjectId(i.bookId));
      if (bad) return res.status(400).json({ message: 'Invalid bookId' });

      const ids = inputItems.map((i) => i.bookId);
      const books = await Book.find({ _id: { $in: ids } })
        .select('title price')
        .session(session);
      const map = new Map(books.map((b) => [String(b._id), b]));

      items = inputItems.map((i) => {
        const b = map.get(String(i.bookId));
        if (!b) throw new Error('Book not found');
        return {
          bookId: b._id,
          title: b.title,
          price: Number(b.price || 0),
          qty: Math.max(1, Number(i.qty || 1)),
        };
      });
    } else {
      items = await itemsFromCart(session, req.user.id);
    }

    if (!items.length) {
      return res.status(400).json({ message: 'ไม่มีสินค้าในออร์เดอร์' });
    }

    // 2) address
    const adr = await resolveAddressSnap(session, req.user.id, req.body || {});
    if (!adr.ok) {
      await session.abortTransaction();
      return res.status(adr.status).json({ message: adr.message, errors: adr.errors });
    }

    // 3) stock
    await checkAndReserveStock(session, items);

    // 4) totals
    const totals = calcTotals(items);

    // 5) payment method
    const methodRaw = req.body?.paymentMethod || req.body?.payment?.method;
    const method = methodRaw ? String(methodRaw) : 'COD';

    // 5.1 สร้าง slipUrl จากไฟล์แนบ (ถ้ามี)
    let slipUrl = '';

    if (req.file) {
      if (req.file.path || req.file.filename) {
        const rawPath = (req.file.path || '').replace(/\\/g, '/');
        if (rawPath) {
          const idx = rawPath.lastIndexOf('/uploads/');
          if (idx !== -1) {
            slipUrl = rawPath.slice(idx); // เริ่มจาก /uploads/...
          } else {
            const fname = req.file.filename || rawPath.split('/').pop();
            slipUrl = '/uploads/' + fname;
          }
        }
      } else if (req.file.buffer) {
        const mime = req.file.mimetype || 'application/octet-stream';
        const extFromMime = mime.includes('/') ? mime.split('/')[1] : 'bin';
        const safeExt = extFromMime.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
        const filename = `slip-${Date.now()}-${Math.round(Math.random() * 1e9)}.${safeExt}`;
        const filepath = path.join(SLIP_DIR, filename);
        fs.writeFileSync(filepath, req.file.buffer);
        slipUrl = `/uploads/slips/${filename}`;
      }
    }

    // 5.2 หรือ front ส่ง path มาใน body
    if (!slipUrl) {
      const rawBodySlip = req.body?.slipUrl || req.body?.slipPath || req.body?.slip;
      if (typeof rawBodySlip === 'string' && rawBodySlip.trim()) {
        let p = rawBodySlip.trim();
        if (!/^https?:\/\//i.test(p)) {
          if (!p.startsWith('/')) p = '/' + p.replace(/^\/+/, '');
        }
        slipUrl = p;
      }
    }

    // 6) สร้าง order
    const [order] = await Order.create(
      [
        {
          userId: req.user.id,
          items,
          address: adr.value,
          status: 'PENDING',
          payment: {
            method,
            ...(slipUrl ? { slipUrl } : {}),
          },
          ...totals,
        },
      ],
      { session }
    );

    // 7) ล้าง cart
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { items: [] } }
    ).session(session);

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

/** GET /api/orders – ออเดอร์ของตัวเอง */
router.get('/', async (req, res, next) => {
  try {
    const list = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: list });
  } catch (e) {
    next(e);
  }
});

/** GET /api/orders/admin – ออเดอร์ทั้งหมด (admin) */
router.get('/admin', async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Order.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({}),
    ]);

    const userIds = Array.from(
      new Set(
        items
          .map((it) => (it.userId ? String(it.userId) : ''))
          .filter(Boolean)
      )
    );

    const users = await User.find({ _id: { $in: userIds } })
      .select('username email')
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const withUser = items.map((it) => ({
      ...it,
      user: userMap.get(String(it.userId)) || null,
    }));

    const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

    res.json({ items: withUser, page, limit, total, totalPages });
  } catch (e) {
    next(e);
  }
});

/** ✅ GET /api/orders/:id/slip – ส่งไฟล์สลิป */
router.get('/:id([0-9a-fA-F]{24})/slip', async (req, res, next) => {
  try {
    const ord = await Order.findById(req.params.id).lean();
    if (!ord) return res.status(404).json({ message: 'Order not found' });

    // เจ้าของหรือ admin เท่านั้น
    const isOwner = String(ord.userId) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    const slipUrl = ord.payment?.slipUrl;
    if (!slipUrl) return res.status(404).json({ message: 'No slip attached' });

    // ถ้าเป็น URL เต็ม (เก็บบน S3/เว็บอื่น) ก็ redirect ไปเลย
    if (/^https?:\/\//i.test(slipUrl)) {
      return res.redirect(slipUrl);
    }

    // เตรียม path ให้ยืดหยุ่นที่สุด
    let p = slipUrl.trim().replace(/\\/g, '/'); // ปรับเป็น / อย่างเดียว
    // ตัด /api ออกถ้ามี
    p = p.replace(/^\/api\/?/, '');
    // ตัด / นำหน้าออก
    p = p.replace(/^\/+/, ''); // ตอนนี้จะได้เช่น "uploads/slips/xxx.jpeg"

    const candidates = [];

    // กรณีปกติ: รันจากโฟลเดอร์ backend → uploads อยู่ใน backend/uploads/...
    candidates.push(path.join(process.cwd(), p)); // process.cwd() คือโฟลเดอร์ที่รัน node

    // เผื่อกรณี UPLOAD_DIR ชี้ไปอีกที่
    // ถ้า p เริ่มที่ uploads/... ให้ตัดคำว่า uploads ออก แล้วต่อกับ UPLOAD_DIR
    const pWithoutUploads = p.replace(/^uploads\/?/, '');
    candidates.push(path.join(UPLOAD_DIR, pWithoutUploads));

    // เลือกไฟล์แรกที่มีอยู่จริง
    let filePath = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        filePath = c;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        message: 'Slip file not found',
        // debug: p,   // ถ้ากลัวข้อมูลโผล่ API มากไปจะคอมเมนต์บรรทัดนี้ก็ได้
      });
    }

    return res.sendFile(path.resolve(filePath));
  } catch (e) {
    next(e);
  }
});


/** GET /api/orders/:id – รายละเอียดออเดอร์ */
router.get('/:id([0-9a-fA-F]{24})', async (req, res, next) => {
  try {
    const ord = await Order.findById(req.params.id).lean();
    if (!ord) return res.status(404).json({ message: 'Order not found' });

    const isOwner = String(ord.userId) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    res.json({ order: ord });
  } catch (e) {
    next(e);
  }
});

/** PATCH /api/orders/:id/cancel – ยกเลิกออเดอร์ */
router.patch('/:id([0-9a-fA-F]{24})/cancel', async (req, res, next) => {
  try {
    const ord = await Order.findById(req.params.id);
    if (!ord) return res.status(404).json({ message: 'Order not found' });

    const isOwner = String(ord.userId) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    const st = (ord.status || '').toUpperCase();
    if (!['PENDING', 'PAID', 'PROCESSING'].includes(st)) {
      return res.status(400).json({ message: 'ไม่สามารถยกเลิกออเดอร์สถานะนี้ได้' });
    }

    ord.status = 'CANCELLED';
    await ord.save();
    res.json({ order: ord });
  } catch (e) {
    next(e);
  }
});

/** PATCH /api/orders/:id/complete – แอดมินยืนยันจัดส่งสำเร็จ */
router.patch('/:id([0-9a-fA-F]{24})/complete', async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const ord = await Order.findById(req.params.id);
    if (!ord) return res.status(404).json({ message: 'Order not found' });

    ord.status = 'COMPLETED';
    await ord.save();
    res.json({ order: ord });
  } catch (e) {
    next(e);
  }
});

/** POST /api/orders/:id/reorder – สั่งซื้ออีกครั้ง */
router.post('/:id([0-9a-fA-F]{24})/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const mode = (req.body?.mode || '').toString();
    const from = await Order.findById(id);
    if (!from) return res.status(404).json({ message: 'Order not found' });

    const isOwner = String(from.userId) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    const ids = from.items.map((it) => it.bookId).filter((x) => mongoose.isValidObjectId(x));
    const books = await Book.find(
      { _id: { $in: ids } },
      { _id: 1, title: 1, price: 1, stock: 1, coverUrl: 1 }
    ).lean();
    const byId = new Map(books.map((b) => [String(b._id), b]));

    if (mode === 'checkout') {
      const warnings = [];
      const items = [];

      for (const it of from.items) {
        const b = byId.get(String(it.bookId));
        if (!b) {
          warnings.push(`"${it.title || it.bookId}" ถูกลบออกจากระบบ`);
          continue;
        }
        const stock = Math.max(0, Number(b.stock ?? 0));
        if (stock <= 0) {
          warnings.push(`"${b.title}" สต๊อกหมด`);
          continue;
        }

        const wantQty = Math.max(1, Number(it.qty || 1));
        const useQty = Math.min(wantQty, stock);
        if (useQty < wantQty) {
          warnings.push(`ลดจำนวน "${b.title}" เหลือ ${useQty} ตามสต๊อก`);
        }

        if (useQty > 0) {
          items.push({
            bookId: String(b._id),
            title: b.title,
            price: Number(b.price || 0),
            qty: useQty,
            coverUrl: b.coverUrl || '',
          });
        }
      }

      if (items.length === 0) {
        return res.status(400).json({ message: 'ไม่มีสินค้าที่พร้อมสั่งซื้อซ้ำ' });
      }
      return res.json({ items, warnings, mode: 'checkout' });
    }

    return res.status(400).json({ message: 'Unsupported reorder mode' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
