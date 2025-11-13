// backend/src/controllers/reviews.js
import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Book } from '../models/Book.js';

export async function getReviews(req, res) {
  const { bookId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const items = await Review.find({ book: bookId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json({ items });
}

export async function getRating(req, res) {
  const { bookId } = req.params;
  const b = await Book.findById(bookId).lean();
  res.json({ avg: b?.avgRating || 0, count: b?.ratingCount || 0 });
}

export async function upsertReview(req, res) {
  const { bookId } = req.params;
  const userId = req.user?._id || req.user?.id;
  if (!userId) return res.status(401).json({ message: 'ต้องล็อกอินก่อนรีวิว' });

  const r = Math.round(Number(req.body?.rating) || 0);
  if (r < 1 || r > 5) return res.status(400).json({ message: 'คะแนนต้อง 1–5' });

  await Review.findOneAndUpdate(
    { book: bookId, user: userId },
    { rating: r, comment: String(req.body?.comment ?? '') },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const agg = await Review.aggregate([
    { $match: { book: new mongoose.Types.ObjectId(bookId) } },
    { $group: { _id: '$book', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avg = agg[0]?.avg || 0;
  const count = agg[0]?.count || 0;
  await Book.updateOne({ _id: bookId }, { $set: { avgRating: avg, ratingCount: count } });

  res.json({ message: 'ok', stats: { avg, count } });
}

export async function deleteMyReview(req, res) {
  const { bookId } = req.params;
  const userId = req.user?._id || req.user?.id;
  if (!userId) return res.status(401).json({ message: 'ต้องล็อกอิน' });

  await Review.deleteOne({ book: bookId, user: userId });

  const agg = await Review.aggregate([
    { $match: { book: new mongoose.Types.ObjectId(bookId) } },
    { $group: { _id: '$book', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = agg[0]?.avg || 0;
  const count = agg[0]?.count || 0;
  await Book.updateOne({ _id: bookId }, { $set: { avgRating: avg, ratingCount: count } });

  res.json({ message: 'deleted', stats: { avg, count } });
}

export async function deleteAllReviews(req, res) {
  const { bookId } = req.params;
  await Review.deleteMany({ book: bookId });
  await Book.updateOne({ _id: bookId }, { $set: { avgRating: 0, ratingCount: 0 } });
  res.json({ message: 'deleted' });
}