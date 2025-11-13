// backend/src/routes/users.js
import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/requireAuth.js';
import { User } from '../models/User.js';

const router = express.Router();

// ใช้ memory storage (ง่ายสุดสำหรับเริ่มต้น)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: (_req, file, cb) => {
    const ok = ['image/png','image/jpeg','image/jpg','image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Invalid avatar type (png, jpg, webp only)'), ok);
  }
});

// ดึงโปรไฟล์
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -passwordHash');
  res.json({ user });
});

// อัปเดตชื่อ/อีเมล (ไม่ต้องอัปเดตแบบ realtime ในหน้า — เราจะแก้ฝั่งหน้าให้)
router.patch('/me', requireAuth, async (req, res) => {
  const allow = ['fullname','email'];
  const update = {};
  for (const k of allow) if (k in req.body) update[k] = req.body[k];

  if (update.email) {
    const exists = await User.findOne({ email: update.email, _id: { $ne: req.user.id } }).select('_id');
    if (exists) return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
  }

  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
    .select('-password -passwordHash');
  res.json({ user });
});

// อัปโหลดอวาตาร์
router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'ต้องมีไฟล์ avatar' });
    await User.updateOne(
      { _id: req.user.id },
      { $set: { avatar: { contentType: req.file.mimetype, data: req.file.buffer, updatedAt: new Date() } } }
    );
    res.json({ message: 'อัปโหลดรูปโปรไฟล์เรียบร้อย' });
  } catch (e) {
    console.error('avatar upload error', e);
    res.status(500).json({ message: 'อัปโหลดไม่สำเร็จ' });
  }
});

// ดึงอวาตาร์
router.get('/me/avatar', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('avatar');
  if (!user?.avatar?.data) return res.status(404).end();
  res.set('Content-Type', user.avatar.contentType || 'image/jpeg');
  res.set('Cache-Control', 'private, max-age=0, no-store');
  res.send(user.avatar.data);
});

// ดึงความชื่นชอบ
router.get('/me/favorites', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('favorites');
  res.json({ favorites: user.favorites || [] });
});

// ✅ อัปเดต favorites
router.put('/me/favorites', requireAuth, async (req, res, next) => {
  try {
    const { favorites } = req.body;
    if (!Array.isArray(favorites)) {
      return res.status(400).json({ message: 'favorites ต้องเป็น array ของ string' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { favorites } },
      { new: true, runValidators: true }
    ).select('favorites');
    res.json({ favorites: user.favorites });
  } catch (err) { next(err); }
});


export default router;
