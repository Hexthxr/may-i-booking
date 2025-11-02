
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { apiBase } from '../api';
import '../styles/adminBookForm.css'; // <<— เพิ่มการอิมพอร์ตไฟล์สไตล์

// ต้องตรงกับ enum ฝั่ง backend (models/Book.js)
const CATS = ['การเงินการลงทุน', 'มังงะ', 'นิยาย', 'อาหารเเละสุขภาพ', 'การเรียน'];

export default function AdminBookForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const nav = useNavigate();

  const [form, setForm] = useState({
    sku: '',
    title: '',
    description: '',
    authors: '',
    publisher: '',
    language: 'TH',
    pages: 0,
    year: 2025,
    category: CATS[0],
    price: 0,
    stock: 0, // ✅ เพิ่ม stock (ค่าเริ่มต้น 0)
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // โหลดข้อมูลเดิมถ้าเป็นโหมดแก้ไข
  useEffect(() => {
    if (!editing) return;
    (async () => {
      const { data } = await api.get(`/books/${id}`);
      setForm({
        sku: data.sku || '',
        title: data.title || '',
        description: data.description || '',
        authors: (data.authors || []).join(', '),
        publisher: data.publisher || '',
        language: data.language || 'TH',
        pages: data.pages || 0,
        year: data.year || 2025,
        category: data.category || CATS[0],
        price: data.price ?? 0,
        stock: data.stock ?? 0, // ✅ ดึง stock จากฐานข้อมูล
      });
      setPreviewUrl(`${apiBase()}/books/${id}/cover?v=${encodeURIComponent(data.updatedAt || '')}`);
    })();
  }, [editing, id]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]:
        name === 'pages' ||
        name === 'year' ||
        name === 'price' ||
        name === 'stock'         // ✅ แปลง stock เป็น number
          ? Number(value)
          : value
    }));
  }

  function onFileInput(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    handleSetFile(f);
  }

  const handleSetFile = (f) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  // Drag & Drop
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleSetFile(f);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        sku: form.sku?.trim() || undefined,
        title: form.title?.trim(),
        description: form.description?.trim(),
        authors: (form.authors || '').split(',').map(s => s.trim()).filter(Boolean),
        publisher: form.publisher?.trim(),
        language: form.language,
        pages: Number(form.pages) || 0,
        year: Number(form.year) || 2025,
        category: form.category,
        price: Number(form.price) || 0,
        stock: Math.max(0, Number(form.stock) || 0), // ✅ ส่งค่า stock ไป backend
      };

      const fd = new FormData();
      fd.append('data', JSON.stringify(payload));
      if (file) fd.append('cover', file);

      if (editing) {
        await api.put(`/books/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/books', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      nav('/admin/books');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="abf-container">
      {/* Header */}
      <div className="abf-header">
        <Link to="/admin/books" className="btn secondary">← กลับรายการหนังสือ</Link>
        <h2>{editing ? 'แก้ไขหนังสือ' : 'เพิ่มหนังสือใหม่'}</h2>
      </div>

      {/* Card */}
      <form onSubmit={onSubmit} className="abf-card">
        {/* LEFT: Cover */}
        <section>
          <div
            className={`abf-cover-drop ${dragOver ? 'drag' : ''}`}
            title="ลากรูปมาวางที่นี่ หรือกดเพื่อเลือกไฟล์"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('abf-file-input')?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="abf-cover-img" />
            ) : (
              <div className="abf-cover-empty">
                <div className="abf-cover-empty-title">ไม่มีรูปปก</div>
                <small>รองรับไฟล์ภาพทั่วไป • แนะนำอัตราส่วน 3:4 • &gt;= 600×800px</small>
              </div>
            )}
          </div>

          <input id="abf-file-input" type="file" accept="image/*" onChange={onFileInput} style={{ display: 'none' }} />

          <div className="abf-file-info">
            {file ? <>ไฟล์ที่เลือก: <strong>{file.name}</strong> ({Math.round(file.size/1024)} KB)</> : 'ยังไม่ได้เลือกไฟล์'}
          </div>
        </section>

        {/* RIGHT: Fields */}
        <section>
          {/* Group: Basic */}
          <FieldGroup title="ข้อมูลทั่วไป">
            <Row label="SKU" hint="เช่น BK-001">
              <input name="sku" value={form.sku} onChange={onChange} placeholder="เช่น BK-001" />
            </Row>

            <Row label="ชื่อเรื่อง" required>
              <input required name="title" value={form.title} onChange={onChange} placeholder="กรอกชื่อหนังสือ" />
            </Row>

            <Row label="คำอธิบาย">
              <textarea name="description" value={form.description} onChange={onChange} rows={5} placeholder="สรุปเนื้อหา/จุดเด่นโดยย่อ" />
            </Row>
          </FieldGroup>

          {/* Group: Publication */}
          <FieldGroup title="สำนักพิมพ์ & รายละเอียด">
            <div className="abf-two">
              <div>
                <Label text="สำนักพิมพ์" />
                <input name="publisher" value={form.publisher} onChange={onChange} placeholder="เช่น MIB Press" />
                <Hint text="ถ้าไม่ทราบสามารถเว้นว่างได้" />
              </div>
              <div>
                <Label text="ภาษา" />
                <select name="language" value={form.language} onChange={onChange}>
                  <option value="TH">TH</option>
                  <option value="EN">EN</option>
                </select>
              </div>
            </div>

            <div className="abf-two">
              <div>
                <Label text="จำนวนหน้า" />
                <input type="number" name="pages" value={form.pages} onChange={onChange} min="0" />
              </div>
              <div>
                <Label text="ปีพิมพ์" />
                <input type="number" name="year" value={form.year} onChange={onChange} min="1900" max="2100" />
              </div>
            </div>

            {/* ✅ แถวสต๊อก: ใช้คลาสเดิม ไม่เปลี่ยนเลย์เอาต์ */}
            <div className="abf-two">
              <div>
                <Label text="สต๊อก" />
                <input type="number" name="stock" value={form.stock} onChange={onChange} min="0" />
              </div>
              <div />
            </div>
          </FieldGroup>

          {/* Group: Authors */}
          <FieldGroup title="ผู้เขียน & หมวดหมู่ & ราคา">
            <Row label="ผู้เขียน (คั่นด้วย ,)" hint="ตัวอย่าง: A, B">
              <input name="authors" value={form.authors} onChange={onChange} placeholder="เช่น A, B" />
            </Row>

            <div className="abf-two">
              <div>
                <Label text="หมวดหมู่" required />
                <select name="category" value={form.category} onChange={onChange}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label text="ราคา" />
                <input type="number" name="price" value={form.price} onChange={onChange} min="0" step="1" />
              </div>
            </div>
          </FieldGroup>

          {/* Actions */}
          <div className="abf-actions">
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? (editing ? 'กำลังบันทึก…' : 'กำลังสร้าง…') : (editing ? 'บันทึกการแก้ไข' : 'สร้างหนังสือ')}
            </button>
            <Link className="btn secondary" to="/admin/books">ยกเลิก</Link>
          </div>
        </section>
      </form>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function FieldGroup({ title, children }) {
  return (
    <div className="abf-group">
      <div className="abf-group-title">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, required, hint, children }) {
  return (
    <div className="abf-row">
      <Label text={label} required={required} />
      {children}
      {hint && <Hint text={hint} />}
    </div>
  );
}

function Label({ text, required }) {
  return (
    <label className="abf-label">
      {text}{required && <span className="abf-required"> *</span>}
    </label>
  );
}

function Hint({ text }) {
  return <div className="abf-hint">{text}</div>;
}
