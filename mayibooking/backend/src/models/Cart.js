import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: String,
  price: Number,
  qty: { type: Number, default: 1, min: 1 },
  coverUrl: String,
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  items: { type: [CartItemSchema], default: [] },
}, { timestamps: true });

export const Cart = mongoose.model('Cart', CartSchema);
