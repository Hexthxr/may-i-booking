// import { Router } from 'express';
// import { Book } from '../models/Book.js';
// import { requireAuth } from '../middleware/auth.js';
// import { requireRole } from '../middleware/roles.js';
// import { upload } from '../middleware/upload.js';

// const router = Router();

// /* -----------------------------------------------------------
//    1) LIST ALL BOOKS  (ต้องอยู่บนสุด)
// ----------------------------------------------------------- */
// router.get('/', async (req, res) => {
//   try {
//     const { category, q, limit } = req.query;
//     const filter = {};
//     if (category) filter.category = category;
//     if (q) filter.title = { $regex: q, $options: 'i' };

//     const books = await Book.find(filter)
//       .select('-cover')
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit || '100'));

//     res.json(books);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// /* -----------------------------------------------------------
//    ⭐ 2) TOP RATED BOOKS  (ต้องอยู่ก่อน /:id)
// ----------------------------------------------------------- */
// router.get('/top-rated', async (req, res) => {
//   try {
//     const top = await Book.aggregate([
//       {
//         $lookup: {
//           from: 'reviews',
//           localField: '_id',
//           foreignField: 'book',
//           as: 'reviews'
//         }
//       },
//       { $addFields: { avgRating: { $avg: '$reviews.rating' } } },
//       { $sort: { avgRating: -1 } },
//       { $limit: 3 },
//       { $project: { cover: 0, reviews: 0 } }
//     ]);
//     res.json(top);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// /* -----------------------------------------------------------
//    🔥 3) BEST SELLERS (ต้องอยู่ก่อน /:id)
// ----------------------------------------------------------- */
// router.get('/best-sellers', async (req, res) => {
//   try {
//     const best = await Book.aggregate([
//       {
//         $lookup: {
//           from: 'orders',
//           localField: '_id',
//           foreignField: 'items.bookId',  // ← schema ของคุณ
//           as: 'orders'
//         }
//       },
//       {
//         $addFields: {
//           sold: {
//             $sum: {
//               $map: {
//                 input: '$orders',
//                 as: 'o',
//                 in: {
//                   $let: {
//                     vars: {
//                       matched: {
//                         $filter: {
//                           input: '$$o.items',
//                           as: 'it',
//                           cond: { $eq: ['$$it.bookId', '$_id'] }
//                         }
//                       }
//                     },
//                     in: { $sum: '$$matched.qty' }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },
//       { $sort: { sold: -1 } },
//       { $limit: 3 },
//       { $project: { cover: 0, orders: 0 } }
//     ]);

//     res.json(best);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// /* -----------------------------------------------------------
//    4) BOOK COVER (ต้องอยู่ก่อน /:id)
// ----------------------------------------------------------- */
// router.get('/:id/cover', async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.id).select('cover updatedAt');
//     if (!book || !book.cover?.data) return res.status(404).end();
//     res.setHeader('Content-Type', book.cover.contentType || 'image/jpeg');
//     res.setHeader('Cache-Control', 'public, max-age=3600');
//     res.send(book.cover.data);
//   } catch (err) {
//     res.status(404).end();
//   }
// });


// /* -----------------------------------------------------------
//    5) GET BOOK BY ID  ❗ ต้องอยู่ในลำดับด้านล่างสุด
// ----------------------------------------------------------- */
// router.get('/:id', async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.id).select('-cover');
//     if (!book) return res.status(404).json({ message: 'Not found' });
//     res.json(book);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


// /* -----------------------------------------------------------
//    6) ADMIN CREATE / UPDATE / DELETE (เหมือนเดิม)
// ----------------------------------------------------------- */
// // (ไม่ย้ายส่วนนี้ เพราะไม่เกี่ยวกับ routing conflict)
// // ...

// export default router;

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
   2) RECOMMENDED / TOP RATED (ตัวอย่าง: ใช้ avgRating)
----------------------------------------------------------- */
router.get('/recommended', async (req, res) => {
  try {
    const items = await Book.find({})
      .select('-cover')
      .sort({ avgRating: -1, ratingCount: -1 })
      .limit(8);

    res.json(items);
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
          foreignField: 'items.bookId',
          as: 'orders',
        },
      },
      {
        $addFields: {
          sold: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'ord',
                in: {
                  $sum: {
                    $map: {
                      input: '$$ord.items',
                      as: 'it',
                      in: {
                        $cond: [
                          { $eq: ['$$it.bookId', '$_id'] },
                          '$$it.qty',
                          0,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 3 },
      { $project: { cover: 0, orders: 0 } },
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
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(book.cover.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
   (ใช้ร่วมกับฟอร์ม AdminBookForm ที่ส่ง FormData: data + cover)
----------------------------------------------------------- */

// helper แปลง payload จาก req.body / req.body.data เป็นโครงที่ Book ต้องการ
function normalizeBookPayload(body = {}) {
  let payload = body;
  if (typeof body.data === 'string') {
    try {
      payload = JSON.parse(body.data);
    } catch {
      throw Object.assign(new Error('Invalid JSON in field "data"'), { status: 400 });
    }
  }

  const authors = Array.isArray(payload.authors)
    ? payload.authors
    : typeof payload.authors === 'string'
      ? payload.authors.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  return {
    sku: payload.sku?.trim() || undefined,
    title: payload.title?.trim(),
    description: payload.description?.trim() || '',
    authors,
    publisher: payload.publisher?.trim() || '',
    language: payload.language || '',
    pages: Number(payload.pages) || 0,
    year: Number(payload.year) || 2025,
    category: payload.category,
    price: Number(payload.price) || 0,
    stock: Math.max(0, Number(payload.stock) || 0),
  };
}

/** CREATE book (admin only) */
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  upload.single('cover'),
  async (req, res) => {
    try {
      const data = normalizeBookPayload(req.body);
      const doc = new Book(data);

      if (req.file) {
        doc.cover = {
          data: req.file.buffer,
          contentType: req.file.mimetype || 'image/jpeg',
        };
      }

      await doc.save();
      const out = doc.toObject();
      delete out.cover;
      res.status(201).json(out);
    } catch (err) {
      console.error(err);
      if (err.status) {
        return res.status(err.status).json({ message: err.message });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  }
);

/** UPDATE book (admin only) */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  upload.single('cover'),
  async (req, res) => {
    try {
      const book = await Book.findById(req.params.id);
      if (!book) return res.status(404).json({ message: 'Not found' });

      const data = normalizeBookPayload(req.body);

      // อัปเดตฟิลด์หลัก
      Object.assign(book, data);

      // ถ้ามีไฟล์ cover ใหม่ → เขียนทับ
      if (req.file) {
        book.cover = {
          data: req.file.buffer,
          contentType: req.file.mimetype || 'image/jpeg',
        };
      }

      await book.save();
      const out = book.toObject();
      delete out.cover;
      res.json(out);
    } catch (err) {
      console.error(err);
      if (err.status) {
        return res.status(err.status).json({ message: err.message });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  }
);

/** DELETE book (admin only) */
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const book = await Book.findByIdAndDelete(req.params.id);
      if (!book) return res.status(404).json({ message: 'Not found' });
      res.status(204).end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
