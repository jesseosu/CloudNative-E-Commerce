import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import Guard from '../components/Guard';

export default function ProductPage(){
  const { id } = useParams();
  const [p, setP] = useState<any | null>(null);
  useEffect(() => { if (id) api.getProduct(id).then(setP); }, [id]);
  if (!p) return <p>Loading…</p>;
  return (
    <div>
      <img src={p.image || 'https://via.placeholder.com/800x400'} alt={p.title} style={{ width: '100%', borderRadius: 8 }} />
      <h1>{p.title}</h1>
      <p>${p.price} · stock {p.stock}</p>
      <Guard>{(jwt)=> <button onClick={async()=>{ await api.addToCart(jwt, p.id, 1); alert('Added to cart'); api.analytics({ type:'add_to_cart', payload:{ id:p.id } }); }}>Add to cart</button>}</Guard>
    </div>
  );
}
