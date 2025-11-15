// frontend/src/pages/Settings.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/settings.module.css';

export default function Settings() {
  const { user } = useAuth();

  // state หลอก ๆ ไว้ให้ toggle เล่น
  const [emailNoti, setEmailNoti] = useState(true);
  const [lineNoti, setLineNoti] = useState(false);
  const [promoNoti, setPromoNoti] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const displayName = user?.name || user?.username || user?.email || 'ผู้ใช้ May i Booking';
  const email = user?.email || 'example@mail.com';

  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <main className={styles.page}>
      <div className="container">
        {/* Head */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>การตั้งค่า</h1>
            <p className={styles.subtitle}>
              จัดการข้อมูลบัญชี ความปลอดภัย และการแจ้งเตือนของคุณในที่เดียว
            </p>
          </div>

          <div className={styles.userChip}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userEmail}>{email}</div>
            </div>
          </div>
        </header>

        {/* layout 2 คอลัมน์ */}
        <div className={styles.layout}>
          {/* เมนูด้านซ้าย (หลอก ๆ ไม่ต้องเปลี่ยนหน้า) */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarGroupLabel}>โปรไฟล์</div>
            <button className={`${styles.sideItem} ${styles.sideItemActive}`}>
              ข้อมูลโปรไฟล์
            </button>
            <button className={styles.sideItem}>บัญชีและความปลอดภัย</button>

            <div className={styles.sidebarGroupLabel}>การแจ้งเตือน</div>
            <button className={styles.sideItem}>แจ้งเตือนและโปรโมชั่น</button>

            <div className={styles.sidebarGroupLabel}>อื่น ๆ</div>
            <button className={styles.sideItem}>ภาษาและรูปแบบการแสดงผล</button>
            <button className={styles.sideItem}>ศูนย์ช่วยเหลือ</button>
          </aside>

          {/* เนื้อหาหลักฝั่งขวา */}
          <section className={styles.content}>
            {/* การ์ด: ข้อมูลโปรไฟล์ */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>ข้อมูลโปรไฟล์</h2>
                  <p className={styles.cardSubtitle}>
                    ข้อมูลพื้นฐานเกี่ยวกับบัญชีของคุณ ใช้สำหรับการออกใบเสร็จและประสบการณ์แนะนำหนังสือ
                  </p>
                </div>
                <button className={styles.ghostBtn} disabled>
                  แก้ไขโปรไฟล์ (กำลังพัฒนา)
                </button>
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>ชื่อที่แสดง</div>
                  <div className={styles.fieldValue}>{displayName}</div>
                  <div className={styles.fieldHint}>จะแสดงเมื่อคุณรีวิวหรือให้คะแนนหนังสือ</div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel}>อีเมล</div>
                  <div className={styles.fieldValue}>{email}</div>
                  <div className={styles.fieldHint}>
                    ใช้สำหรับรับใบยืนยันคำสั่งซื้อและการกู้คืนบัญชี
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel}>เบอร์โทรศัพท์</div>
                  <div className={styles.fieldValue}>ยังไม่ได้ระบุ</div>
                  <div className={styles.fieldHint}>
                    เพิ่มเบอร์โทรเพื่อให้ติดต่อได้สะดวกยิ่งขึ้น (ตัวอย่าง)
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel}>ที่อยู่เริ่มต้นสำหรับจัดส่ง</div>
                  <div className={styles.fieldValue}>จัดการได้ที่ &quot;สมุดที่อยู่&quot;</div>
                  <div className={styles.fieldHint}>
                    ใช้เป็นค่าตั้งต้นเมื่อคุณสั่งซื้อหนังสือ (ข้อมูลจำลอง)
                  </div>
                </div>
              </div>
            </section>

            {/* การ์ด: ความปลอดภัยของบัญชี */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>ความปลอดภัยของบัญชี</h2>
                  <p className={styles.cardSubtitle}>
                    ปรับการตั้งค่าด้านความปลอดภัย เพื่อให้บัญชีของคุณปลอดภัยอยู่เสมอ
                  </p>
                </div>
              </div>

              <div className={styles.rowBetween}>
                <div>
                  <div className={styles.fieldLabel}>รหัสผ่าน</div>
                  <div className={styles.fieldHint}>
                    แนะนำให้ใช้รหัสผ่านที่มีตัวอักษร ตัวเลข และสัญลักษณ์ผสมกัน
                  </div>
                </div>
                <button className={styles.primaryOutline} disabled>
                  เปลี่ยนรหัสผ่าน (จำลอง)
                </button>
              </div>

              <div className={styles.divider} />

              <div className={styles.rowBetween}>
                <div>
                  <div className={styles.fieldLabel}>การยืนยันสองขั้นตอน (2FA)</div>
                  <div className={styles.fieldHint}>
                    เมื่อเปิดใช้งาน ระบบจะขอรหัสยืนยันเพิ่มเติมเมื่อเข้าสู่ระบบ (ตัวอย่าง)
                  </div>
                </div>
                <Toggle
                  checked={twoFA}
                  onChange={setTwoFA}
                  labelOn="เปิดอยู่"
                  labelOff="ปิดอยู่"
                />
              </div>

              <div className={styles.rowBetween}>
                <div>
                  <div className={styles.fieldLabel}>แจ้งเตือนเมื่อเข้าสู่ระบบจากอุปกรณ์ใหม่</div>
                  <div className={styles.fieldHint}>
                    ส่งอีเมลแจ้งเตือนทุกครั้งที่มีการเข้าสู่ระบบจากอุปกรณ์แปลกใหม่ (จำลอง)
                  </div>
                </div>
                <span className={styles.badgeMuted}>เปิดใช้งานอยู่ (หลอก ๆ)</span>
              </div>
            </section>

            {/* การ์ด: การแจ้งเตือน & การตั้งค่าอื่น ๆ */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>การแจ้งเตือนและการตั้งค่าอื่น ๆ</h2>
                  <p className={styles.cardSubtitle}>
                    เลือกว่าคุณอยากรับข่าวสารเกี่ยวกับคำสั่งซื้อ โปรโมชัน และหนังสือที่แนะนำอย่างไร
                  </p>
                </div>
              </div>

              <div className={styles.cardSectionTitle}>ช่องทางการแจ้งเตือน</div>

              <div className={styles.rowBetween}>
                <div>
                  <div className={styles.fieldLabel}>อีเมล</div>
                  <div className={styles.fieldHint}>
                    รับอัปเดตคำสั่งซื้อ ใบเสร็จ และข่าวสารสำคัญผ่านอีเมล
                  </div>
                </div>
                <Toggle
                  checked={emailNoti}
                  onChange={setEmailNoti}
                  labelOn="เปิด"
                  labelOff="ปิด"
                />
              </div>

              <div className={styles.rowBetween}>
                <div>
                  <div className={styles.fieldLabel}>LINE / แอปแชท</div>
                  <div className={styles.fieldHint}>
                    ผูกบัญชี LINE เพื่อรับการแจ้งเตือนแบบเรียลไทม์ (ตัวอย่าง)
                  </div>
                </div>
                <Toggle
                  checked={lineNoti}
                  onChange={setLineNoti}
                  labelOn="เปิด"
                  labelOff="ปิด"
                />
              </div>

              <div className={styles.divider} />

              <div className={styles.cardSectionTitle}>คอนเทนต์และโปรโมชั่น</div>

              <div className={styles.rowBetween}>
                <div>
                  <div className={styles.fieldLabel}>รับข้อเสนอหนังสือที่คัดมาให้เฉพาะคุณ</div>
                  <div className={styles.fieldHint}>
                    ระบบจะใช้ประวัติการดูและการสั่งซื้อ เพื่อแนะนำหนังสือที่น่าจะถูกใจ
                  </div>
                </div>
                <Toggle
                  checked={promoNoti}
                  onChange={setPromoNoti}
                  labelOn="รับ"
                  labelOff="ไม่รับ"
                />
              </div>

              <div className={styles.divider} />

              <div className={styles.cardSectionTitle}>ภาษาและธีม</div>

              <div className={styles.rowBetween}>
                <div>
                  <div className={styles.fieldLabel}>ภาษา</div>
                  <div className={styles.fieldHint}>ตัวอย่าง: ไทย (ค่าเริ่มต้น)</div>
                </div>
                <span className={styles.badgeMuted}>ไทย</span>
              </div>

              <div className={styles.rowBetween}>
                <div>
                  <div className={styles.fieldLabel}>โหมดธีมเว็บไซต์</div>
                  <div className={styles.fieldHint}>
                    ตัวเลือกตัวอย่างระหว่างโหมดสว่างและโหมดมืด (ยังไม่เชื่อมจริง)
                  </div>
                </div>
                <Toggle
                  checked={darkMode}
                  onChange={setDarkMode}
                  labelOn="โหมดมืด"
                  labelOff="โหมดสว่าง"
                />
              </div>
            </section>

            <p className={styles.devNote}>
              หน้านี้เป็นตัวอย่างหน้าการตั้งค่าของ May i Booking ข้อมูลที่แสดงและปุ่มต่าง ๆ
              เป็นข้อมูลจำลองเพื่อใช้ในการออกแบบเท่านั้น
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ---------- Toggle Component (หลอก ๆ) ---------- */

function Toggle({ checked, onChange, labelOn, labelOff }) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
      <span className={styles.toggleLabel}>{checked ? labelOn : labelOff}</span>
    </button>
  );
}
