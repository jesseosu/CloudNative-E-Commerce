import { useEffect, useState } from 'react';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

export default function Home(){
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { api.listProducts().then(setItems); api.analytics({ type: 'view', payload: { page: 'home' } }); }, []);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
      {items.map(p => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}
