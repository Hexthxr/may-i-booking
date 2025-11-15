// frontend/src/pages/TrackOrder.jsx
import { useSearchParams } from 'react-router-dom';
import styles from '../styles/trackOrder.module.css';

const MOCK_ORDER = {
  orderId: 'MIB-2025-000123',
  placedDate: '12 กุมภาพันธ์ 2025',
  estimate: 'ภายในวันที่ 17 กุมภาพันธ์ 2025',
  status: 'OUT_FOR_DELIVERY', // ORDERED | PROCESSING | SHIPPED | OUT_FOR_DELIVERY | DELIVERED
  shippingMethod: 'ขนส่งเอกชน - Kerry Express (ตัวอย่าง)',
  trackingCode: 'KR123456789TH',
  recipient: 'Lactasoy (ตัวอย่าง)',
  address:
    '123/45 ซอยตัวอย่าง ถนนบางกะปิ เขตห้วยขวาง กรุงเทพมหานคร 10310 (ข้อมูลจำลอง)',
};

const STEPS = [
  { key: 'ORDERED', label: 'รับคำสั่งซื้อแล้ว' },
  { key: 'PROCESSING', label: 'กำลังจัดเตรียมสินค้า' },
  { key: 'SHIPPED', label: 'ส่งให้ขนส่งแล้ว' },
  { key: 'OUT_FOR_DELIVERY', label: 'กำลังนำส่ง' },
  { key: 'DELIVERED', label: 'จัดส่งสำเร็จ' },
];

const MOCK_TIMELINE = [
  {
    time: 'วันนี้ · 10:15 น.',
    title: 'พนักงานกำลังนำพัสดุไปจัดส่ง',
    desc: 'พัสดุออกจากศูนย์กระจายสินค้าและอยู่ระหว่างจัดส่งไปยังที่อยู่ของคุณ',
  },
  {
    time: 'เมื่อวานนี้ · 19:40 น.',
    title: 'พัสดุถึงศูนย์กระจายสินค้าปลายทาง',
    desc: 'คลัง กทม. (ลาดกระบัง) ทำการคัดแยกพัสดุเรียบร้อย',
  },
  {
    time: '2 วันที่แล้ว · 14:20 น.',
    title: 'ขนส่งรับพัสดุจากร้านค้าแล้ว',
    desc: 'พัสดุถูกส่งมอบให้ Kerry Express และกำลังเดินทางไปยังศูนย์กระจายสินค้า',
  },
  {
    time: '3 วันที่แล้ว · 09:05 น.',
    title: 'คำสั่งซื้อได้รับการยืนยัน',
    desc: 'ระบบ May i Booking ยืนยันการชำระเงินและเริ่มจัดเตรียมหนังสือของคุณ',
  },
];

export default function TrackOrder() {
  const [params] = useSearchParams();
  const orderIdFromUrl = params.get('orderId') || params.get('id');
  const order = {
    ...MOCK_ORDER,
    orderId: orderIdFromUrl || MOCK_ORDER.orderId,
  };

  const currentStepIndex =
    STEPS.findIndex((s) => s.key === order.status) === -1
      ? 0
      : STEPS.findIndex((s) => s.key === order.status);

  return (
    <main className={styles.page}>
      <div className="container">
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>ติดตามสถานะการจัดส่ง</h1>
            <p className={styles.subtitle}>
              ดูความคืบหน้าคำสั่งซื้อหนังสือของคุณ ตั้งแต่ร้านจัดเตรียม ไปจนถึงจัดส่งถึงปลายทาง
            </p>
          </div>

          <div className={styles.orderChip}>
            <div className={styles.orderLabel}>หมายเลขคำสั่งซื้อ</div>
            <div className={styles.orderId}>{order.orderId}</div>
          </div>
        </header>

        {/* Layout 2 คอลัมน์ */}
        <div className={styles.layout}>
          {/* ฝั่งซ้าย: step สถานะ + timeline */}
          <section className={styles.mainCard}>
            {/* แถบสถานะหลัก */}
            <div className={styles.statusHeader}>
              <div>
                <div className={styles.statusLabel}>สถานะปัจจุบัน</div>
                <div className={styles.statusBadge}>
                  {currentStepIndex === STEPS.length - 1
                    ? 'จัดส่งสำเร็จ'
                    : currentStepIndex >= 3
                    ? 'กำลังนำส่ง'
                    : 'กำลังดำเนินการ'}
                </div>
                <div className={styles.estimate}>
                  ⏱️ ประมาณการจัดส่ง: <strong>{order.estimate}</strong> (ข้อมูลจำลอง)
                </div>
              </div>
            </div>

            {/* Stepper บอกลำดับการจัดส่ง */}
            <div className={styles.stepper}>
              {STEPS.map((step, idx) => {
                const isDone = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className={styles.stepItem}>
                    <div
                      className={[
                        styles.stepCircle,
                        isDone ? styles.stepCircleDone : '',
                        isCurrent && !isDone ? styles.stepCircleCurrent : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={[
                          styles.stepLine,
                          idx < currentStepIndex ? styles.stepLineDone : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      />
                    )}
                    <div className={styles.stepLabel}>{step.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Timeline รายละเอียด */}
            <div className={styles.timelineCard}>
              <h2 className={styles.timelineTitle}>ไทม์ไลน์การจัดส่ง (ตัวอย่าง)</h2>
              <ul className={styles.timelineList}>
                {MOCK_TIMELINE.map((item, i) => (
                  <li key={i} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTime}>{item.time}</div>
                      <div className={styles.timelineItemTitle}>{item.title}</div>
                      <div className={styles.timelineDesc}>{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ฝั่งขวา: ข้อมูลจัดส่ง */}
          <aside className={styles.sideCard}>
            <h2 className={styles.sideTitle}>รายละเอียดการจัดส่ง</h2>

            <div className={styles.sideSection}>
              <div className={styles.fieldLabel}>วิธีการจัดส่ง</div>
              <div className={styles.fieldValue}>{order.shippingMethod}</div>
              <div className={styles.fieldHint}>
                ข้อมูลบริษัทขนส่งนี้เป็นตัวอย่าง สามารถเปลี่ยนเป็นจริงได้ในอนาคต
              </div>
            </div>

            <div className={styles.sideSection}>
              <div className={styles.fieldLabel}>หมายเลขติดตามพัสดุ</div>
              <div className={styles.trackingBox}>
                <span className={styles.trackingCode}>{order.trackingCode}</span>
                <button className={styles.copyBtn} type="button" disabled>
                  คัดลอก (จำลอง)
                </button>
              </div>
              <div className={styles.fieldHint}>
                ปุ่ม &quot;คัดลอก&quot; เป็นตัวอย่างเท่านั้น ยังไม่ได้เชื่อมต่อฟังก์ชันจริง
              </div>
            </div>

            <div className={styles.sideSection}>
              <div className={styles.fieldLabel}>ผู้รับ</div>
              <div className={styles.fieldValue}>{order.recipient}</div>
            </div>

            <div className={styles.sideSection}>
              <div className={styles.fieldLabel}>ที่อยู่จัดส่ง</div>
              <div className={styles.fieldValue}>{order.address}</div>
            </div>

            <div className={styles.sideSection}>
              <div className={styles.fieldLabel}>สรุปสถานะ</div>
              <ul className={styles.summaryList}>
                <li>คำสั่งซื้อถูกสร้างเมื่อ: {order.placedDate}</li>
                <li>ระยะเวลาจัดส่งโดยประมาณ: 3–5 วันทำการ (ข้อมูลจำลอง)</li>
                <li>สถานะปัจจุบัน: ยังอยู่ระหว่างการจัดส่ง</li>
              </ul>
            </div>

            <div className={styles.notice}>
              หน้านี้ใช้สำหรับออกแบบและทดสอบ UI การติดตามสถานะเท่านั้น
              ข้อมูลทั้งหมดเป็นตัวอย่าง ยังไม่ได้เชื่อมต่อระบบติดตามพัสดุจริง
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
