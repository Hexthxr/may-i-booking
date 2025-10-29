import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  fullName:   { type: String, required: true, trim: true },          // ชื่อผู้รับ
  phone:      { type: String, required: true, trim: true },           // 08x-xxx-xxxx ได้
  line1:      { type: String, required: true, trim: true },           // บ้านเลขที่/หมู่บ้าน/อาคาร
  line2:      { type: String, trim: true },                           // ซอย/ถนน (ถ้ามี)
  subdistrict:{ type: String, required: true, trim: true },           // ตำบล/แขวง
  district:   { type: String, required: true, trim: true },           // อำเภอ/เขต
  province:   { type: String, required: true, trim: true },           // จังหวัด
  postcode:   { type: String, required: true, trim: true, match: /^[0-9]{5}$/ },
  isDefault:  { type: Boolean, default: false },
}, { timestamps: true });

export const Address = mongoose.model('Address', AddressSchema);
