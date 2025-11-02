export const CART_KEY = 'mib:cart';

export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}

export function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  // แจ้งให้ Header badge และหน้า Cart รีแอคทันที
  window.dispatchEvent(new Event('mib:cart:update'));
}

export function addToCart(newItems) {
  const cur = getCart();
  const merged = [...cur];
  for (const it of newItems) {
    const i = merged.findIndex(x => String(x.bookId) === String(it.bookId));
    if (i >= 0) merged[i].qty = (Number(merged[i].qty) || 1) + (Number(it.qty) || 1);
    else merged.push({ ...it, qty: Number(it.qty) || 1 });
  }
  setCart(merged);
}
