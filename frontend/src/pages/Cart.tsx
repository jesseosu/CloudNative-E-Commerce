import Guard from '../components/Guard';
import { api } from '../api';
import { useEffect, useState } from 'react';

export default function Cart(){
  return (
    <Guard>
      {(jwt)=> <Inner jwt={jwt} />}
    </Guard>
  );
}

function Inner({ jwt }: { jwt: string }){
  const [items, setItems] = useState<any[]>([]);
  const refresh = async()=> setItems(await api.getCart(jwt));
  useEffect(() => { refresh(); }, []);
  const total = items.reduce((s, it)=> s + it.price * it.qty, 0);
  return (
    <div>
      <h2>Your Cart</h2>
      {items.map(it=> (
        <div key={it.sk} style={{ display:'flex', gap: 12, alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
          <div>{it.productId}</div>
          <div>qty {it.qty}</div>
          <div>${it.price}</div>
          <button onClick={async()=>{ await api.removeFromCart(jwt, it.productId); refresh(); }}>Remove</button>
        </div>
      ))}
      <p>Total: ${total.toFixed(2)}</p>
    </div>
  );
}
