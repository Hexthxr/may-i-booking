// frontend/src/components/PromptPayQR.jsx
import { useMemo } from "react";

/**
 * แสดง QR พร้อมเพย์ (สร้างลิงก์ภาพผ่าน api.qrserver)
 * ใช้ props:
 *  - id: หมายเลขพร้อมเพย์
 *  - amount: จำนวนเงิน
 *  - merchantName: ชื่อร้าน (optional)
 *  - merchantCity: เมือง (optional)
 *  - ref1: รหัสอ้างอิง (optional)
 */
export default function PromptPayQR({
  id = "",
  amount = 0,
  merchantName = "May i Booking",
  merchantCity = "Bangkok",
  ref1 = "",
}) {
  const qrData = useMemo(() => {
    const encoded = encodeURIComponent(`promptpay://${id}?amount=${amount}`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
  }, [id, amount]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <img
        src={qrData}
        alt="PromptPay QR"
        style={{
          width: 260,
          height: 260,
          borderRadius: 16,
          border: "1px solid #eee",
          boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
          objectFit: "contain",
        }}
      />
      <div style={{ marginTop: 10, textAlign: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>พร้อมเพย์: {id}</div>
        <div style={{ fontSize: 15, marginTop: 2 }}>
          จำนวนเงิน: ฿{amount.toLocaleString("th-TH")}
        </div>
        {merchantName && (
          <div style={{ fontSize: 13, opacity: 0.8 }}>{merchantName}</div>
        )}
        {ref1 && (
          <div style={{ fontSize: 12, color: "#888" }}>Ref: {ref1}</div>
        )}
      </div>
    </div>
  );
}
