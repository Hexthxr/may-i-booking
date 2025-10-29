// frontend/src/pages/Settings.jsx
export default function Settings(){
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 to-yellow-400 opacity-90" />
        <div className="relative p-6 text-white">
          <div className="text-xl font-semibold">การตั้งค่า</div>
          <div className="opacity-90 text-sm">ตั้งค่าการใช้งานบัญชีของคุณ</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5 text-sm text-gray-600">
        ยังไม่มีตัวเลือกเฉพาะ แต่ออกแบบโครงไว้พร้อมเพิ่มตั้งค่า (ภาษา ธีม การแจ้งเตือน ฯลฯ)
      </div>
    </div>
  );
}
