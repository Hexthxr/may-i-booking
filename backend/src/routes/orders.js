// backend/src/routes/orders.js
import express from 'express';
import multer from 'multer';
import { Order } from '../models/Order.js';
import { requireAuth } from '../middleware/requireAuth.js'; // adjust path if your auth middleware differs

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    const ok = ['image/png','image/jpeg','image/jpg','application/pdf'].includes(file.mimetype);
    cb(ok ? null : new Error('Invalid file type (allow: png, jpg, pdf)'), ok);
  }
});

// POST /api/orders - create order
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, address, shippingFee = 0, discount = 0 } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items required' });
    }

    const required = ['fullname','phone','houseNo','subdistrict','district','province','postcode'];
    for (const k of required) {
      if (!address?.[k]) return res.status(400).json({ message: `Address field '${k}' is required` });
    }

    // Subtotal (NOTE: In production verify price from DB to prevent tampering)
    const subtotal = items.reduce((s, it) => s + (Number(it.price) * Number(it.qty)), 0);
    const total = Math.max(0, Number(subtotal) + Number(shippingFee) - Number(discount));

    const order = await Order.create({
      user: req.user.id,
      items: items.map(b => ({ book: b.book, title: b.title, price: b.price, qty: b.qty })),
      address,
      subtotal,
      shippingFee,
      discount,
      total,
      currency: 'THB',
      paymentMethod: 'bank_transfer_slip',
      status: 'pending',
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/orders/:id/slip - upload payment slip
router.post('/:id/slip', requireAuth, upload.single('slip'), async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!req.file) return res.status(400).json({ message: 'Slip file is required' });

    order.paymentSlip = {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedAt: new Date(),
    };
    order.status = 'paid';
    await order.save();
    res.json({ message: 'Slip uploaded', orderId: order._id });
  } catch (err) {
    console.error('Upload slip error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/my - list current user's orders
router.get('/my', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/:id - get single order (ownership required)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/:id/slip - stream slip
router.get('/:id/slip', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order || !order.paymentSlip?.data) return res.status(404).json({ message: 'No slip' });
    res.set('Content-Type', order.paymentSlip.contentType || 'image/jpeg');
    res.set('Cache-Control', 'private, max-age=0, no-store');
    res.send(order.paymentSlip.data);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
