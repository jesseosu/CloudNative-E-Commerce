import Guard from '../components/Guard';
import { api } from '../api';

export default function Checkout(){
  return <Guard>{(jwt)=> <button onClick={async()=>{ const res = await api.checkout(jwt); alert(`Order ${res.orderId} paid. Total $${res.total}`); }}>Pay Now</button>}</Guard>;
}
