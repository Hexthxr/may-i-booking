// backend/src/utils/orderTotals.js
export function calcTotals(items) {
  // items: [{ price:Number, qty:Number }]
  const subtotal = items.reduce(
    (s, it) => s + Number(it.price || 0) * Math.max(1, Number(it.qty || 1)),
    0
  );
  // กติกาเดโม่: ยอด >= 500 ส่งฟรี ไม่งั้น 35 บาท
  const shipping = subtotal > 500 ? 0 : (items.length ? 35 : 0);
  const discount = 0; // เผื่อรองรับคูปองในอนาคต
  const total = Math.max(0, subtotal + shipping - discount);
  return { subtotal, shipping, discount, total };
}
