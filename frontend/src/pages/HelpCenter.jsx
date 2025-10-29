// frontend/src/pages/HelpCenter.jsx
export default function HelpCenter(){
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 to-yellow-400 opacity-90" />
        <div className="relative p-6 text-white">
          <div className="text-xl font-semibold">ศูนย์ช่วยเหลือ</div>
          <div className="opacity-90 text-sm">คำถามที่พบบ่อยและช่องทางติดต่อ</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5 text-sm text-gray-600 space-y-2">
        <p>• วิธีสั่งซื้อและแนบสลีป</p>
        <p>• วิธีแก้ปัญหาการเข้าสู่ระบบ</p>
        <p>• ติดต่อทีมสนับสนุน: support@mib.example</p>
      </div>
    </div>
  );
}
