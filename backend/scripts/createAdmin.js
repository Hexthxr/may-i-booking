import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

const { MONGODB_URI } = process.env;

async function main() {
  await connectDB(MONGODB_URI);
  const username = 'admin';
  const email = 'admin@example.com';
  const password = 'admin123';
  let user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    user = new User({ username, email, role: 'admin' });
    await user.setPassword(password);
    await user.save();
    console.log('Admin created: admin / admin123');
  } else {
    console.log('Admin already exists');
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});