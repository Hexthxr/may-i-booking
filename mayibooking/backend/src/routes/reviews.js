// backend/src/routes/reviews.js
import express from 'express';
import { getReviews, getRating, upsertReview, deleteMyReview } from '../controllers/reviews.js';
import { authRequired } from '../middleware/auth.js'; // <- ใช้ path และชื่อให้ตรง

const router = express.Router({ mergeParams: true });

router.get('/', getReviews);
router.get('/rating', getRating);
router.post('/', authRequired, upsertReview);
router.delete('/me', authRequired, deleteMyReview);

export default router;


