import BookCard from './BookCard';

export default function CategorySection({ title, items }){
  return (
    <section className="container" style={{margin:'18px auto'}}>
      <h2 style={{margin:'8px 0 12px 0'}}>{title}</h2>
      <div className="grid">
        {items.map(b => <BookCard key={b._id} book={b} />)}
      </div>
    </section>
  )
}