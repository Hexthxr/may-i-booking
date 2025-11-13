import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    title: { type: String },                 // เก็บ snapshot กันกรณีชื่อ/ราคาเปลี่ยน
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AddressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String, phone: String,
    line1: String, line2: String,
    subdistrict: String, district: String, province: String, postcode: String,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    address: { type: AddressSnapshotSchema, required: true },  // snapshot ที่อยู่ขณะสั่งซื้อ
    note: { type: String },

    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    total:   { type: Number, required: true },

    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING'
    },

    payment: {
      method: { type: String, default: 'COD' },       // รองรับ 'BANK_TRANSFER' ภายหลัง
      slipUrl: { type: String },                      // เผื่อแนบสลิป (ถ้ามี endpoint อัปโหลด)
    },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, createdAt: -1 });

export const Order = mongoose.model('Order', OrderSchema);
