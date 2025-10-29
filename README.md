# May i Booking (คล้าย SE-ED, ธีมเขียว-เหลือง)

โครงสร้างครบทั้ง Backend (Node/Express/MongoDB) และ Frontend (React + Vite) พร้อมระบบผู้ใช้/แอดมิน, CRUD หนังสือ, อัปโหลดปก (ผ่านแอดมิน), และสิทธิ์: ผู้ใช้ทั่วไปดูรายละเอียดได้ แต่สั่งซื้อได้เฉพาะสมาชิก (เดโมแจ้งเตือน)

## 1) วิธีตั้งค่า MongoDB Atlas (แชร์ลิงก์เพื่อทำงานร่วมกัน)
1. ไปที่ https://www.mongodb.com/atlas และสมัคร/สร้าง Project + Cluster ฟรี
2. สร้าง Database User (กำหนด username/password) และ IP Access (Allow from anywhere 0.0.0.0/0 สำหรับเดโม)
3. กด Connect > Drivers เพื่อคัดลอก Connection String (เช่น `mongodb+srv://<user>:<pass>@<cluster>/<dbname>?retryWrites=true&w=majority`)
4. แชร์ Connection String ให้ทีม (อย่าโพสต์สาธารณะ) และวางในไฟล์ `backend/.env` ที่ตัวแปร `MONGODB_URI`
5. ให้ทุกคน clone โปรเจ็กต์นี้ แล้ว `npm install` ทั้ง `backend` และ `frontend`

## 2) รัน Backend
```bash
cd backend
cp .env.example .env   # เติมค่าให้ครบ
npm install
npm run create-admin   # สร้าง admin: admin/admin123
npm run dev
```
API: `http://localhost:4000/api` และรูปที่อัปโหลดจะเสิร์ฟจาก `http://localhost:4000/uploads/<filename>`

## 3) รัน Frontend
```bash
cd frontend
cp .env.example .env   # ถ้ารันโลคัล ไม่ต้องแก้
npm install
npm run dev
```
เปิด `http://localhost:5173`

## 4) บทบาทและสิทธิ์
- **ผู้ใช้ใหม่ (ไม่ล็อกอิน)**: เห็นหน้ารายละเอียดหนังสือได้ แต่ปุ่มสั่งซื้อจะเตือนให้สมัคร/ล็อกอินก่อน
- **สมาชิก (user)**: ล็อกอินได้ (เดโมยังไม่เปิดขายจริง)
- **ผู้ดูแล (admin)**: เห็นเมนู Admin, เพิ่ม/แก้ไข/ลบหนังสือ, อัปโหลดปก

> การเป็นแอดมินตอนสมัครต้องใส่ `ADMIN_SIGNUP_CODE` ตรงกับที่เซิร์ฟเวอร์ตั้งไว้ หรือใช้สคริปต์ `npm run create-admin`

## 5) โครงสร้างโฟลเดอร์
- `backend/uploads` เก็บไฟล์ปกที่อัปโหลด
- `frontend/src/components` UI components (Header/Footer/BookCard/...)
- `frontend/src/pages` หน้า Home/Login/Register/BookDetail/Admin*

## 6) หมวดหมู่ที่รองรับ
- การเงินการลงทุน, มังงะ, นิยาย, อาหารเเละสุขภาพ, การเรียน

> หน้า Home จะดึงแต่ละหมวดหมู่มาโชว์ 5 เล่มอัตโนมัติ (ถ้ายังไม่มีแสดงว่ายังไม่ถูกเพิ่มผ่าน Admin)

## 7) Security Notes (เดโม)
- ใช้ JWT (Bearer) ใน header
- CORS whitelist ตาม `CLIENT_ORIGIN` ใน `.env`
- ปกเก็บแบบ local (เดโม) — โปรดพิจารณา S3/Cloudinary ในโปรดักชัน