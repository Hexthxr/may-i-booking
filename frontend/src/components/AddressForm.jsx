// frontend/src/components/AddressForm.jsx
import { useState, useEffect } from 'react';

export default function AddressForm({ value, onChange, compact=false }){
  const [addr, setAddr] = useState({
    fullname: '', phone: '', houseNo: '', village: '', alley: '', road: '',
    subdistrict: '', district: '', province: '', postcode: '',
  });
  useEffect(() => { if (value) setAddr(prev => ({ ...prev, ...value })); }, [value]);
  const set = (k,v) => { const next = { ...addr, [k]: v }; setAddr(next); onChange?.(next); };
  const Row = ({label,k,req}) => (
    <label className="block mb-2">
      <span className="text-sm">{label}{req && ' *'}</span>
      <input className="mt-1 w-full border rounded px-3 py-2"
             value={addr[k]||''} onChange={e=>set(k,e.target.value)} required={!!req} />
    </label>
  );
  return (
    <div className={compact? 'grid grid-cols-2 gap-3' : ''}>
      <Row label="ชื่อ-สกุล" k="fullname" req/>
      <Row label="โทร" k="phone" req/>
      <Row label="บ้านเลขที่" k="houseNo" req/>
      <Row label="หมู่บ้าน" k="village" />
      <Row label="ซอย" k="alley" />
      <Row label="ถนน" k="road" />
      <Row label="ตำบล/แขวง" k="subdistrict" req/>
      <Row label="อำเภอ/เขต" k="district" req/>
      <Row label="จังหวัด" k="province" req/>
      <Row label="รหัสไปรษณีย์" k="postcode" req/>
    </div>
  );
}
