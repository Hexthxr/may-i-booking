// backend/src/models/Order.js
import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 1 },
}, { _id: false });

const AddressSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  phone: { type: String, required: true },
  houseNo: { type: String, required: true },
  village: { type: String },
  alley: { type: String },
  road: { type: String },
  subdistrict: { type: String, required: true },
  district: { type: String, required: true },
  province: { type: String, required: true },
  postcode: { type: String, required: true },
}, { _id: false });

const PaymentSlipSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  data: Buffer,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [OrderItemSchema], required: true },
  address: { type: AddressSchema, required: true },
  subtotal: { type: Number, required: true, min: 0 },
  shippingFee: { type: Number, required: true, min: 0, default: 0 },
  discount: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'THB' },
  paymentMethod: { type: String, enum: ['bank_transfer_slip'], default: 'bank_transfer_slip' },
  paymentSlip: PaymentSlipSchema,
  status: { type: String, enum: ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

export const Order = mongoose.model('Order', OrderSchema);
