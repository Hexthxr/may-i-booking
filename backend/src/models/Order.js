// backend/src/models/Order.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

// สินค้าในออเดอร์แต่ละรายการ
const OrderItemSchema = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

// ที่อยู่จัดส่ง (snapshot ตอนสั่งซื้อ)
const AddressSchema = new Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    subdistrict: String,
    district: String,
    province: String,
    postcode: String,
  },
  { _id: false }
);

// ข้อมูลงานจ่ายเงิน
const PaymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ['COD', 'TRANSFER'],
      default: 'COD',
    },
    slipUrl: { type: String }, // path ของรูปสลิปใน /uploads/slips/...
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: v => Array.isArray(v) && v.length > 0,
    },

    // ใช้ชื่อ field ว่า address (ให้ตรงกับโค้ด routes ล่าสุด)
    address: { type: AddressSchema, required: true },

    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },

    payment: {
      type: PaymentSchema,
      default: () => ({ method: 'COD' }),
    },

    // ตัวเลขสรุปยอด
    subtotal: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// ✅ export แบบ named export ให้ใช้ import { Order } ได้
export const Order = mongoose.model('Order', OrderSchema);
