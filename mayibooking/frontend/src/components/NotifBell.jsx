import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LS_KEY = 'mib:reservations';

export default function NotifBell(){
  const nav = useNavigate();
  const [count, setCount] = useState(0);

  const load = ()=>{
    try{
      const list = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      setCount(Array.isArray(list) ? list.length : 0);
    }catch{ setCount(0); }
  };

  useEffect(()=>{
    load();
    const onNotify = ()=> load();
    const onStorage = (e)=> { if(e.key === LS_KEY) load(); };
    window.addEventListener('mib:notify', onNotify);
    window.addEventListener('storage', onStorage);
    return ()=>{
      window.removeEventListener('mib:notify', onNotify);
      window.removeEventListener('storage', onStorage);
    };
  },[]);

  return (
    <button
      onClick={()=> nav('/notifications')}
      title="การแจ้งเตือน"
      style={{ position:'relative', background:'transparent', border:0, cursor:'pointer', width:34, height:34, display:'grid', placeItems:'center' }}
    >
      <span style={{ fontSize:20 }}>🔔</span>
      <span style={{
        position:'absolute', top:-4, right:-2, minWidth:18, height:18, display:'grid', placeItems:'center',
        padding:'0 4px', borderRadius:999, background: (count>0 ? '#ef4444' : '#e5e7eb'), color:'#fff',
        fontSize:11, fontWeight:700
      }}>{count}</span>
    </button>
  );
}
