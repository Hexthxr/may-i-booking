import { NavLink } from 'react-router-dom';

const CATS = ['การเงินการลงทุน','มังงะ','นิยาย','อาหารเเละสุขภาพ','การเรียน'];

export default function CategorySidebar(){
  return (
    <aside style={{
      minWidth: 220,
      background: 'white',
      borderRadius: 16,
      boxShadow: '0 6px 20px rgba(0,0,0,.06)',
      padding: 12,
      height: 'fit-content',
      position: 'sticky',
      top: 80
    }}>
      <h3 style={{margin:'6px 8px'}}>หมวดหมู่</h3>
      <nav style={{display:'grid', gap:8}}>
        {CATS.map(c => (
          <NavLink
            key={c}
            to={`/category/${encodeURIComponent(c)}`}
            style={({isActive})=>({
              padding:'10px 12px',
              borderRadius:12,
              background: isActive ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 700
            })}
          >{c}</NavLink>
        ))}
      </nav>
    </aside>
  )
}
