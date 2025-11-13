import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { Address } from '../models/Address.js';

const router = express.Router();
const MAX_ADDRESSES = 10;

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const items = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, updatedAt: -1 });
    res.json({ items });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const count = await Address.countDocuments({ userId: req.user.id });
    if (count >= MAX_ADDRESSES) {
      return res.status(400).json({ message: `เพิ่มได้ไม่เกิน ${MAX_ADDRESSES} ที่อยู่` });
    }

    const payload = { ...req.body, userId: req.user.id, isDefault: !!req.body.isDefault };
    if (payload.isDefault) {
      await Address.updateMany({ userId: req.user.id, isDefault: true }, { $set: { isDefault: false } });
    }

    const doc = await Address.create(payload);
    res.status(201).json({ item: doc });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const addr = await Address.findOne({ _id: id, userId: req.user.id });
    if (!addr) return res.status(404).json({ message: 'ไม่พบที่อยู่' });

    const update = { ...req.body };
    if (typeof update.isDefault === 'boolean' && update.isDefault) {
      await Address.updateMany({ userId: req.user.id, isDefault: true, _id: { $ne: id } }, { $set: { isDefault: false } });
    }
    Object.assign(addr, update);
    await addr.save();
    res.json({ item: addr });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const addr = await Address.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!addr) return res.status(404).json({ message: 'ไม่พบที่อยู่' });

    if (addr.isDefault) {
      const latest = await Address.findOne({ userId: req.user.id }).sort({ updatedAt: -1 });
      if (latest) { latest.isDefault = true; await latest.save(); }
    }
    res.json({ message: 'ลบเรียบร้อย' });
  } catch (err) { next(err); }
});

router.patch('/:id/default', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const addr = await Address.findOne({ _id: id, userId: req.user.id });
    if (!addr) return res.status(404).json({ message: 'ไม่พบที่อยู่' });

    await Address.updateMany({ userId: req.user.id, isDefault: true }, { $set: { isDefault: false } });
    addr.isDefault = true;
    await addr.save();
    res.json({ item: addr });
  } catch (err) { next(err); }
});

export default router;
