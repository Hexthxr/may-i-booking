// frontend/src/utils/booking.js
const KEY = 'mib:bookings';

export function getBookings(){
  try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch{ return []; }
}

export function addBooking(item){
  // item = { bookId, title, coverUrl, ts? }
  const now = Date.now();
  const list = getBookings();
  const exists = list.some(x => String(x.bookId) === String(item.bookId));
  const next = exists ? list : [{ ...item, ts: now }, ...list].slice(0, 30); // limit 30
  localStorage.setItem(KEY, JSON.stringify(next));
  notify(next.length);
  return next;
}

export function removeBooking(bookId){
  const list = getBookings().filter(x => String(x.bookId) !== String(bookId));
  localStorage.setItem(KEY, JSON.stringify(list));
  notify(list.length);
  return list;
}

export function clearBookings(){
  localStorage.removeItem(KEY);
  notify(0);
}

function notify(count){
  try{
    window.dispatchEvent(new CustomEvent('mib:booking:update', { detail: { count } }));
  }catch{
    window.dispatchEvent(new Event('mib:booking:update'));
  }
}
