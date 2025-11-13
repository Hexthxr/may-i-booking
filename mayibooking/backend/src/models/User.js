import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AvatarSchema = new mongoose.Schema({
  contentType: String,
  data: Buffer,
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },

  

  // เพิ่มฟิลด์ใหม่
  fullname: { type: String },
  avatar:   { type: AvatarSchema },
  favorites:   { type: [String], default: [] },
}, { timestamps: true });

UserSchema.methods.setPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};



export const User = mongoose.model('User', UserSchema);
