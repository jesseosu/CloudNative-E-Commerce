import { Link } from 'react-router-dom';

type Props = { p: any, onAdd?: (id: string) => void };
export default function ProductCard({ p, onAdd }: Props){
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
      <img src={p.image || 'https://via.placeholder.com/300x200'} alt={p.title} style={{ width: '100%', borderRadius: 8 }} />
      <h3>{p.title}</h3>
      <p>${p.price} · stock {p.stock}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to={`/product/${p.id}`}>View</Link>
        {onAdd && <button onClick={() => onAdd(p.id)}>Add to cart</button>}
      </div>
    </div>
  );
}
