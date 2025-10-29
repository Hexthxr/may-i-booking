import mongoose from 'mongoose';

export const ALLOWED_CATEGORIES = ['การเงินการลงทุน','มังงะ','นิยาย','อาหารเเละสุขภาพ','การเรียน'];

const CoverSchema = new mongoose.Schema({
  data: { type: Buffer },
  contentType: { type: String }
}, { _id: false });

const BookSchema = new mongoose.Schema({
  sku: { type: String, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  cover: { type: CoverSchema, default: null },
  authors: [{ type: String }],
  publisher: { type: String, default: '' },
  language: { type: String, default: 'TH' },
  pages: { type: Number, default: 0 },
  year: { type: Number, default: 2025 },
  category: { type: String, enum: ALLOWED_CATEGORIES, required: true },
  price: { type: Number, required: true, min: 0, default: 0 }
}, { timestamps: true });

export const Book = mongoose.model('Book', BookSchema);
