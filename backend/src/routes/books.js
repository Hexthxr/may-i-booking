import { Router } from 'express';
import { Book } from '../models/Book.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = Router();

/* -----------------------------------------------------------
   1) LIST ALL BOOKS  (ต้องอยู่บนสุด)
----------------------------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const { category, q, limit } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) filter.title = { $regex: q, $options: 'i' };

    const books = await Book.find(filter)
      .select('-cover')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit || '100'));

    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* -----------------------------------------------------------
   ⭐ 2) TOP RATED BOOKS  (ต้องอยู่ก่อน /:id)
----------------------------------------------------------- */
router.get('/top-rated', async (req, res) => {
  try {
    const top = await Book.aggregate([
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'book',
          as: 'reviews'
        }
      },
      { $addFields: { avgRating: { $avg: '$reviews.rating' } } },
      { $sort: { avgRating: -1 } },
      { $limit: 3 },
      { $project: { cover: 0, reviews: 0 } }
    ]);
    res.json(top);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* -----------------------------------------------------------
   🔥 3) BEST SELLERS (ต้องอยู่ก่อน /:id)
----------------------------------------------------------- */
router.get('/best-sellers', async (req, res) => {
  try {
    const best = await Book.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.bookId',  // ← schema ของคุณ
          as: 'orders'
        }
      },
      {
        $addFields: {
          sold: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'o',
                in: {
                  $let: {
                    vars: {
                      matched: {
                        $filter: {
                          input: '$$o.items',
                          as: 'it',
                          cond: { $eq: ['$$it.bookId', '$_id'] }
                        }
                      }
                    },
                    in: { $sum: '$$matched.qty' }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 3 },
      { $project: { cover: 0, orders: 0 } }
    ]);

    res.json(best);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* -----------------------------------------------------------
   4) BOOK COVER (ต้องอยู่ก่อน /:id)
----------------------------------------------------------- */
router.get('/:id/cover', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select('cover updatedAt');
    if (!book || !book.cover?.data) return res.status(404).end();
    res.setHeader('Content-Type', book.cover.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(book.cover.data);
  } catch (err) {
    res.status(404).end();
  }
});


/* -----------------------------------------------------------
   5) GET BOOK BY ID  ❗ ต้องอยู่ในลำดับด้านล่างสุด
----------------------------------------------------------- */
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select('-cover');
    if (!book) return res.status(404).json({ message: 'Not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* -----------------------------------------------------------
   6) ADMIN CREATE / UPDATE / DELETE (เหมือนเดิม)
----------------------------------------------------------- */
// (ไม่ย้ายส่วนนี้ เพราะไม่เกี่ยวกับ routing conflict)
// ...

export default router;
