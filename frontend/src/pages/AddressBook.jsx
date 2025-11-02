import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';   // ✅ เพิ่ม
import api from '../api';
import styles from '../styles/addressbook.module.css';

const empty = {
  fullName: '', phone: '',
  line1: '', line2: '',
  subdistrict: '', district: '', province: '', postcode: '',
  isDefault: false,
};

export default function AddressBook(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // object หรือ null
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // id ที่จะลบ

  // ✅ รองรับกลับไปหน้าเดิม (เช่น /checkout)
  const nav = useNavigate();
  const location = useLocation();
  const backTo =
    location.state?.backTo ||
    new URLSearchParams(location.search).get('backTo') ||
    null;

  const load = async ()=>{
    setLoading(true);
    try{
      const { data } = await api.get('/addresses');
      const arr = data.items || data || [];
      setItems(arr);

      // ✅ ถ้ามาจาก Checkout และยังไม่มีที่อยู่เลย → เปิดฟอร์มสร้างให้ทันที
      if (backTo && (arr?.length || 0) === 0 && !editing) {
        setEditing({ ...empty, isDefault: true });
      }
    } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[]);

  const onCreate = ()=> setEditing({ ...empty, isDefault: items.length === 0 }); // ที่อยู่อันแรก set default ให้เลย
  const onEdit = (it)=> setEditing({ ...it });
  const onCancel = ()=> setEditing(null);

  // ✅ helper: หลังทำรายการเสร็จ ถ้ามี backTo → กลับ
  const goBackIfNeeded = ()=>{
    if (backTo) {
      nav(backTo, { replace: true, state: { fromAddresses: true } });
    }
  };

  const onSave = async ()=>{
    setSaving(true);
    try{
      const payload = { ...editing };
      if (payload._id) {
        const { data } = await api.patch(`/addresses/${payload._id}`, payload);
        setEditing(null);
        setItems(prev => prev.map(x => x._id === data.item._id ? data.item : x));
        // ถ้ากลายเป็น default อันอื่นต้องไม่ default → รีโหลดชัวร์ ๆ
        if (data.item.isDefault) await load();
        // ✅ ถ้ามาจาก Checkout → กลับไป
        goBackIfNeeded();
      } else {
        const { data } = await api.post('/addresses', payload);
        setEditing(null);
        setItems(prev => [data.item, ...prev]);
        if (data.item.isDefault) await load();
        // ✅ ถ้ามาจาก Checkout → กลับไป
        goBackIfNeeded();
      }
    } finally { setSaving(false); }
  };

  const onDelete = async (id)=>{
    await api.delete(`/addresses/${id}`);
    setConfirm(null);
    await load();
  };

  const setDefault = async (id)=>{
    await api.patch(`/addresses/${id}/default`);
    await load();
    // ✅ ตั้งค่า default เสร็จแล้ว ถ้าเข้าจาก Checkout → กลับไปทันที
    goBackIfNeeded();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h1 className={styles.title}>ที่อยู่จัดส่ง</h1>

        <div style={{display:'flex', gap:8}}>
          {/* ✅ ปุ่มกลับหน้า Checkout ถ้ามี backTo */}
          {backTo && !editing && (
            <button
              className={styles.btnGhost}
              onClick={()=> nav(backTo, { replace:true, state:{ fromAddresses:true } })}
              title="กลับไปชำระเงิน"
            >
              ← กลับไปชำระเงิน
            </button>
          )}
          {!editing && <button className={styles.btnPrimary} onClick={onCreate}>+ เพิ่มที่อยู่</button>}
        </div>
      </div>

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      {editing && (
        <div className={styles.card}>
          <div className={styles.formGrid}>
            <label><span>ชื่อผู้รับ</span>
              <input className={styles.input} value={editing.fullName} onChange={e=>setEditing({...editing, fullName:e.target.value})}/>
            </label>
            <label><span>เบอร์โทร</span>
              <input className={styles.input} value={editing.phone} onChange={e=>setEditing({...editing, phone:e.target.value})}/>
            </label>

            <label className={styles.col2}><span>บ้านเลขที่/หมู่บ้าน/อาคาร</span>
              <input className={styles.input} value={editing.line1} onChange={e=>setEditing({...editing, line1:e.target.value})}/>
            </label>
            <label className={styles.col2}><span>ซอย/ถนน (ถ้ามี)</span>
              <input className={styles.input} value={editing.line2} onChange={e=>setEditing({...editing, line2:e.target.value})}/>
            </label>

            <label><span>ตำบล/แขวง</span>
              <input className={styles.input} value={editing.subdistrict} onChange={e=>setEditing({...editing, subdistrict:e.target.value})}/>
            </label>
            <label><span>อำเภอ/เขต</span>
              <input className={styles.input} value={editing.district} onChange={e=>setEditing({...editing, district:e.target.value})}/>
            </label>
            <label><span>จังหวัด</span>
              <input className={styles.input} value={editing.province} onChange={e=>setEditing({...editing, province:e.target.value})}/>
            </label>
            <label><span>รหัสไปรษณีย์</span>
              <input className={styles.input} value={editing.postcode} onChange={e=>setEditing({...editing, postcode:e.target.value})}/>
            </label>

            <label className={styles.col2} style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" checked={!!editing.isDefault} onChange={e=>setEditing({...editing, isDefault:e.target.checked})}/>
              ตั้งเป็นที่อยู่เริ่มต้น
            </label>
          </div>

          <div className={styles.formActions}>
            <button className={styles.btnGhost} onClick={onCancel}>ยกเลิก</button>
            <button className={styles.btnPrimary} onClick={onSave} disabled={saving}>
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
          </div>
        </div>
      )}

      {/* รายการที่อยู่ */}
      {loading ? (
        <div className={styles.note}>กำลังโหลด…</div>
      ) : items.length === 0 ? (
        <div className={styles.note}>ยังไม่มีที่อยู่ จิ้ม “เพิ่มที่อยู่” ได้เลย</div>
      ) : (
        <div className={styles.grid}>
          {items.map(it=>(
            <div key={it._id} className={styles.addrCard}>
              <div className={styles.addrHead}>
                <div className={styles.addrName}>
                  {it.fullName} {it.isDefault && <span className={styles.badge}>ค่าเริ่มต้น</span>}
                </div>
                <div className={styles.addrPhone}>{it.phone}</div>
              </div>
              <div className={styles.addrBody}>
                <div>{it.line1}</div>
                {it.line2 && <div>{it.line2}</div>}
                <div>{it.subdistrict} {it.district} {it.province} {it.postcode}</div>
              </div>
              <div className={styles.addrActions}>
                {!it.isDefault && <button className={styles.btnTiny} onClick={()=>setDefault(it._id)}>ตั้งค่าเริ่มต้น</button>}
                <button className={styles.btnTiny} onClick={()=>onEdit(it)}>แก้ไข</button>
                <button className={styles.btnTinyDanger} onClick={()=>setConfirm(it._id)}>ลบ</button>
              </div>

              {/* กล่องยืนยันลบแบบง่าย ๆ */}
              {confirm === it._id && (
                <div className={styles.confirm}>
                  <span>ยืนยันลบที่อยู่นี้หรือไม่?</span>
                  <button className={styles.btnTiny} onClick={()=>setConfirm(null)}>ยกเลิก</button>
                  <button className={styles.btnTinyDanger} onClick={()=>onDelete(it._id)}>ลบ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
