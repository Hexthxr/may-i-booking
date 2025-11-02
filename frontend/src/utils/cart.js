// frontend/src/utils/cart.js
import api from '../api';

export const CART_KEY = 'mib:cart';

/* ---------------- Local cart helpers (ยังไม่ล็อกอิน) ---------------- */
export function getLocalCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}

export function setLocalCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('mib:cart:update'));
}

// รวมสินค้าด้วย bookId
export function addToLocalCart(newItems) {
  const current = getLocalCart();
  const map = new Map(current.map(it => [String(it.bookId), { ...it }]));
  for (const it of newItems || []) {
    const id = String(it.bookId);
    const prev = map.get(id);
    const qty = Math.max(1, Number(it.qty || 1));
    if (prev) {
      map.set(id, { ...prev, qty: (Number(prev.qty)||1) + qty });
    } else {
      map.set(id, {
        bookId: id,
        title: it.title || id,
        price: Number(it.price || 0),
        qty,
        coverUrl: it.coverUrl || ''
      });
    }
  }
  const merged = Array.from(map.values());
  setLocalCart(merged);
  return merged;
}

export function setQtyLocal(bookId, qty) {
  const v = Math.max(1, Number(qty) || 1);
  const next = getLocalCart().map(it => String(it.bookId) === String(bookId) ? { ...it, qty: v } : it);
  setLocalCart(next);
  return next;
}

export function removeLocalItems(ids) {
  const set = new Set((ids || []).map(String));
  const next = getLocalCart().filter(it => !set.has(String(it.bookId)));
  setLocalCart(next);
  return next;
}

export function clearLocalCart() {
  setLocalCart([]);
  return [];
}

/* ---------------- Server cart helpers (ล็อกอินแล้ว) ---------------- */
// ทั้งหมด return เป็น "array ของ items" เพื่อให้หน้า Cart นำไป normalize ต่อ

export async function fetchServerCart() {
  const { data } = await api.get('/cart');
  return Array.isArray(data) ? data : (data?.items || data?.cart?.items || []);
}

export async function addServerCart(newItems) {
  // backend รองรับ POST /cart/items  { items:[{ bookId, qty }]}
  const payload = Array.isArray(newItems) ? { items: newItems } : { items: [newItems] };
  const { data } = await api.post('/cart/items', payload);
  const items = Array.isArray(data) ? data : (data?.items || data?.cart?.items || []);
  window.dispatchEvent(new Event('mib:cart:update'));
  return items;
}

export async function setServerQty(bookId, qty) {
  // backend: PUT /cart/qty  { bookId, qty }
  const v = Math.max(1, Number(qty) || 1);
  const { data } = await api.put('/cart/qty', { bookId, qty: v });
  const items = Array.isArray(data) ? data : (data?.items || data?.cart?.items || []);
  window.dispatchEvent(new Event('mib:cart:update'));
  return items;
}

export async function removeServerItems(ids) {
  // backend: DELETE /cart/items  (body ต้องอยู่ใน { data })
  const { data } = await api.delete('/cart/items', { data: { ids } });
  const items = Array.isArray(data) ? data : (data?.items || data?.cart?.items || []);
  window.dispatchEvent(new Event('mib:cart:update'));
  return items;
}

export async function clearServerCart() {
  const { data } = await api.delete('/cart');
  const items = Array.isArray(data) ? data : (data?.items || data?.cart?.items || []);
  window.dispatchEvent(new Event('mib:cart:update'));
  return items;
}

/* ---------------- Sync local → server หลังล็อกอิน ---------------- */
export async function syncLocalToServerAndClear() {
  const items = getLocalCart();
  if (!items.length) return [];
  const merged = await addServerCart(items);
  setLocalCart([]);
  return merged;
}

/* ---------------- Badge นับจำนวนทั้งหมด ---------------- */
export async function getCartCount(isLoggedIn) {
  if (isLoggedIn) {
    try {
      const items = await fetchServerCart();
      return items.reduce((s, it) => s + (Number(it.qty)||1), 0);
    } catch { return 0; }
  }
  return getLocalCart().reduce((s, it) => s + (Number(it.qty)||1), 0);
}
