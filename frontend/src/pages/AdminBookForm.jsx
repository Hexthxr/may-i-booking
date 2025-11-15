import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { apiBase } from '../api';
import '../styles/adminBookForm.css';

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
    stock: 0,
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ ใหม่: popup หลังบันทึกสำเร็จ
  const [successInfo, setSuccessInfo] = useState(null);

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
        stock: data.stock ?? 0,
      });
      setPreviewUrl(
        `${apiBase()}/books/${id}/cover?v=${encodeURIComponent(
          data.updatedAt || ''
        )}`
      );
    })();
  }, [editing, id]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'pages' ||
        name === 'year' ||
        name === 'price' ||
        name === 'stock'
          ? Number(value)
          : value,
    }));
  }

  function onFileInput(e) {
    const f = e.target.files?.[0];
    if (f) handleSetFile(f);
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
        authors: (form.authors || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        publisher: form.publisher?.trim(),
        language: form.language,
        pages: Number(form.pages) || 0,
        year: Number(form.year) || 2025,
        category: form.category,
        price: Number(form.price) || 0,
        stock: Math.max(0, Number(form.stock) || 0),
      };

      const fd = new FormData();
      fd.append('data', JSON.stringify(payload));
      if (file) fd.append('cover', file);

      if (editing) {
        await api.put(`/books/${id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/books', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // ✅ แสดง popup แทนการ redirect ทันที
      setSuccessInfo({
        mode: editing ? 'edit' : 'create',
        title: payload.title,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const closeSuccess = () => setSuccessInfo(null);
  const goToList = () => {
    setSuccessInfo(null);
    nav('/admin/books');
  };

  return (
    <div className="abf-container">
      {/* ✅ Popup แจ้งผล */}
      {successInfo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '20px 24px',
              maxWidth: 420,
              width: '90%',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ marginBottom: 8 }}>
              {successInfo.mode === 'edit'
                ? 'แก้ไขหนังสือสำเร็จ'
                : 'เพิ่มหนังสือใหม่สำเร็จ'}
            </h3>
            <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 16 }}>
              {successInfo.title
                ? `เล่ม: ${successInfo.title}`
                : 'บันทึกข้อมูลหนังสือเรียบร้อยแล้ว'}
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 8,
              }}
            >
              <button
                type="button"
                className="btn secondary"
                onClick={closeSuccess}
              >
                ปิด
              </button>
              <button type="button" className="btn" onClick={goToList}>
                ไปหน้ารายการหนังสือ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="abf-header">
        <Link to="/admin/books" className="btn secondary">
          ← กลับรายการหนังสือ
        </Link>
        <h2>{editing ? 'แก้ไขหนังสือ' : 'เพิ่มหนังสือใหม่'}</h2>
      </div>

      {/* Card */}
      <form onSubmit={onSubmit} className="abf-card">
        {/* LEFT: Cover */}
        <section>
          <div
            className={`abf-cover-dropzone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() =>
              document.getElementById('abf-file-input')?.click()
            }
          >
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="abf-cover-img" />
            ) : (
              <div className="abf-cover-empty">
                <div className="abf-cover-empty-title">ไม่มีรูปปก</div>
                <small>
                  รองรับไฟล์ภาพทั่วไป • แนะนำอัตราส่วน 3:4 • &gt;= 600×800px
                </small>
              </div>
            )}
          </div>

          <input
            id="abf-file-input"
            type="file"
            accept="image/*"
            onChange={onFileInput}
            style={{ display: 'none' }}
          />

          <div className="abf-hint" style={{ marginTop: 8 }}>
            คลิก หรือ ลากรูปภาพมาวาง เพื่อเปลี่ยนปกหนังสือ
          </div>
        </section>

        {/* RIGHT: Form fields */}
        <section>
          <FieldGroup>
            <div className="abf-two">
              <div>
                <Label text="SKU (ถ้ามี)" />
                <input
                  name="sku"
                  value={form.sku}
                  onChange={onChange}
                  placeholder="เช่น MIB-001"
                />
                <Hint text="รหัสภายในร้าน ใช้ค้นหาหรือจัดสต๊อก" />
              </div>
              <div>
                <Label text="หมวดหมู่" required />
                <select
                  name="category"
                  value={form.category}
                  onChange={onChange}
                >
                  {CATS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label text="ชื่อหนังสือ" required />
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                required
              />
            </div>

            <div>
              <Label text="คำอธิบาย / รายละเอียด" />
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={5}
              />
            </div>

            <div className="abf-two">
              <div>
                <Label text="ผู้เขียน" />
                <input
                  name="authors"
                  value={form.authors}
                  onChange={onChange}
                  placeholder="คั่นหลายคนด้วย ,"
                />
              </div>
              <div>
                <Label text="สำนักพิมพ์" />
                <input
                  name="publisher"
                  value={form.publisher}
                  onChange={onChange}
                />
              </div>
            </div>
          </FieldGroup>

          <FieldGroup title="รายละเอียดเพิ่มเติม">
            <div className="abf-two">
              <div>
                <Label text="ภาษา" />
                <input
                  name="language"
                  value={form.language}
                  onChange={onChange}
                />
              </div>
              <div>
                <Label text="จำนวนหน้า" />
                <input
                  type="number"
                  name="pages"
                  value={form.pages}
                  onChange={onChange}
                  min="0"
                />
              </div>
            </div>

            <div className="abf-two">
              <div>
                <Label text="ปีพิมพ์" />
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={onChange}
                  min="1900"
                  max="2100"
                />
              </div>
            </div>

            <div className="abf-two">
              <div>
                <Label text="ราคา (บาท)" required />
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={onChange}
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <Label text="สต๊อก" />
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={onChange}
                  min="0"
                />
              </div>
            </div>
          </FieldGroup>

          <div className="abf-actions">
            <button type="submit" className="btn" disabled={submitting}>
              {submitting
                ? editing
                  ? 'กำลังบันทึก...'
                  : 'กำลังเพิ่ม...'
                : editing
                  ? 'บันทึกการแก้ไข'
                  : 'เพิ่มหนังสือ'}
            </button>
            <Link to="/admin/books" className="btn secondary">
              ยกเลิก
            </Link>
          </div>
        </section>
      </form>
    </div>
  );
}

function FieldGroup({ title, children }) {
  return (
    <section className="abf-group">
      {title && <h3 className="abf-group-title">{title}</h3>}
      <div className="abf-group-body">{children}</div>
    </section>
  );
}

function Label({ text, required }) {
  return (
    <label className="abf-label">
      {text}
      {required && <span className="abf-required"> *</span>}
    </label>
  );
}

function Hint({ text }) {
  return <div className="abf-hint">{text}</div>;
}
