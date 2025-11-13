// // backend/src/config/paths.js
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // โฟลเดอร์ uploads อยู่ที่ backend/uploads เสมอ (ไม่สนใจว่าเริ่มรันจากไหน)
// export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// // สร้างถ้ายังไม่มี
// if (!fs.existsSync(UPLOAD_DIR)) {
//   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// }

// backend/src/config/paths.js
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ให้โฟลเดอร์อัปโหลดอยู่ที่ backend/uploads เสมอ
export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// สร้างโฟลเดอร์ถ้ายังไม่มี
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
