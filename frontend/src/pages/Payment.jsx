// frontend/src/pages/Payment.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PromptPayQR from "../components/PromptPayQR";
import api from "../api";
import styles from "../styles/checkout.module.css";

const PROMPTPAY_ID = "0812345678";        // TODO: ใส่พร้อมเพย์จริง
const MERCHANT_NAME = "May i Booking";

export default function Payment() {
  const nav = useNavigate();
  const location = useLocation();

  const [amount, setAmount] = useState(0);
  const [refCode, setRefCode] = useState("");
  const [notice, setNotice] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // สิ่งที่ต้องใช้ส่งกลับไปสร้าง order
  const [payload, setPayload] = useState(null); // {items, addressId, summary}

  // สลิป
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState("");

  // โหลดข้อมูลที่ส่งมาจาก Checkout (หรือ sessionStorage กันรีเฟรช)
  useEffect(() => {
    let pay = location.state;
    if (!pay?.amount) {
      try { pay = JSON.parse(sessionStorage.getItem("mib:pay") || "{}"); } catch {}
    }
    if (!pay?.amount || !pay?.items?.length || !pay?.addressId) {
      alert("ข้อมูลการชำระเงินไม่ครบ");
      return nav("/checkout", { replace: true });
    }
    setAmount(Number(pay.amount || 0));
    setRefCode(pay.ref || "");
    setPayload({ items: pay.items, addressId: pay.addressId, summary: pay.summary });
    // เก็บกันรีเฟรช
    sessionStorage.setItem("mib:pay", JSON.stringify(pay));
  }, [location.state, nav]);

  const acceptFile = (f) => {
    if (!f) return false;
    if (!f.type?.startsWith("image/")) { setNotice("ไฟล์สลิปต้องเป็นรูปภาพ"); return false; }
    if (f.size > 8 * 1024 * 1024) { setNotice("ไฟล์ต้องไม่เกิน 8MB"); return false; }
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
    setNotice("");
    return true;
  };
  const onPickSlip = (e) => acceptFile(e.target.files?.[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  // ▶️ สร้างออร์เดอร์แบบ TRANSFER + แนบสลิป (ใช้ endpoint เดิม /orders)
  const confirmPayment = async () => {
    if (!slipFile) return setNotice("กรุณาแนบสลิปก่อนยืนยัน");
    if (!payload?.items?.length || !payload?.addressId) {
      return setNotice("ข้อมูลออร์เดอร์ไม่ครบ กรุณากลับไปหน้า Checkout");
    }

    setUploading(true); setNotice("");
    try {
      const fd = new FormData();
      fd.append("paymentMethod", "TRANSFER");
      fd.append("addressId", payload.addressId);
      fd.append(
        "items",
        JSON.stringify(
          payload.items.map(it => ({
            bookId: it.bookId,
            qty: Number(it.qty || 1),
            price: Number(it.price || 0),
          }))
        )
      );
      if (payload.summary) fd.append("summary", JSON.stringify(payload.summary));
      fd.append("slip", slipFile);
      fd.append("refCode", refCode);
      fd.append("amount", amount);

      await api.post("/orders", fd, { headers: { "Content-Type": "multipart/form-data" } });

      // พยายามล้างรายการที่ชำระออกจากตะกร้า
      try {
        const params = new URLSearchParams();
        payload.items.forEach(it => params.append("ids", it.bookId));
        await api.delete(`/cart/items?${params.toString()}`);
      } catch {
        try { await api.post("/cart/clear", { ids: payload.items.map(it => it.bookId) }); } catch {}
      }

      alert("อัปโหลดสลิปเรียบร้อย! ระบบจะตรวจสอบและยืนยันคำสั่งซื้อ");
      nav("/orders?status=TO_SHIP", { replace: true });
    } catch (err) {
      console.error("confirmPayment error:", err);
      setNotice(err?.response?.data?.message || err?.message || "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  if (!payload) return null;

  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <div className={styles.brand}>May i Booking</div>
        <div className={styles.steps}>
          <span className={styles.stepDone}>ตะกร้า</span>
          <span className={styles.stepDone}>ชำระเงิน</span>
          <span className={styles.stepActive}>อัปโหลดสลิป</span>
        </div>
      </div>

      <h2 className={styles.title}>ชำระเงินผ่านพร้อมเพย์</h2>
      <p className={styles.subtitle}>สแกน QR เพื่อชำระ แล้วแนบสลิปเพื่อยืนยัน</p>
      {notice && <div className={`${styles.card} ${styles.notice}`}>{notice}</div>}

      <div className={styles.twoCol}>
        {/* LEFT: QR */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.sectionTitle}>QR พร้อมเพย์</div>
            <PromptPayQR
              id={PROMPTPAY_ID}
              amount={amount}
              merchantName={MERCHANT_NAME}
              ref1={refCode}
            />
            <div style={{ textAlign: "center", fontSize: 12, opacity: 0.7, marginTop: -6 }}>
              Ref: {refCode}
            </div>
          </div>
        </div>

        {/* RIGHT: แนบสลิป */}
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.sectionTitle}>แนบสลิปการชำระเงิน</div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              style={{
                border: dragOver ? "2px dashed #23c55e" : "2px dashed #ddd",
                background: dragOver ? "rgba(35,197,94,0.05)" : "transparent",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                อัปโหลดสลิป (สูงสุด 8MB)
              </div>

              {/* ปุ่มอัปโหลดสวย ๆ */}
              <div className={styles.uploadWrapper}>
                <input
                  id="slipFile"
                  type="file"
                  accept="image/*"
                  className={styles.realFileInput}
                  onChange={onPickSlip}
                />

                <label htmlFor="slipFile" className={styles.prettyUploadBtn}>
                  📤 เลือกไฟล์สลิป
                </label>

                <span className={styles.fileLabel}>
                  {slipFile ? slipFile.name : "ยังไม่ได้เลือกไฟล์"}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "#607d8b", marginTop: 6 }}>
                หรือ ลากไฟล์สลิปมาวางในกรอบนี้
              </div>

              {slipPreview && (
                <img
                  src={slipPreview}
                  alt="สลิป"
                  style={{
                    width: "100%",
                    marginTop: 10,
                    borderRadius: 12,
                    border: "1px solid #eee",
                  }}
                />
              )}
            </div>

            <div className={styles.actionCol} style={{ marginTop: 20 }}>
              <button
                className={styles.buyBtn}
                disabled={uploading}
                onClick={confirmPayment}
              >
                {uploading ? "กำลังอัปโหลด..." : "ยืนยันการชำระเงิน"}
              </button>
              <button
                onClick={() => nav("/checkout")}
                className={styles.secondaryBtn}
              >
                กลับไปหน้า Checkout
              </button>
            </div>
          </div>

          {/* สรุปยอด (ย่อ) */}
          <div className={styles.card}>
            <div className={styles.sectionTitle}>ยอดชำระทั้งหมด</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>รวม</span>
              <span>฿{Number(amount || 0).toLocaleString("th-TH")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
