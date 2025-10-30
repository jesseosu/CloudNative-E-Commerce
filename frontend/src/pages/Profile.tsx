import Guard from '../components/Guard';
import { api } from '../api';
import { useEffect, useState } from 'react';

export default function Profile(){
  return <Guard>{(jwt)=> <Inner jwt={jwt} />}</Guard>;
}

function Inner({ jwt }: { jwt: string }){
  const [me, setMe] = useState<any>(null);
  useEffect(()=>{ api.me(jwt).then(setMe); },[]);
  if (!me) return <p>Loading…</p>;
  return (
    <pre style={{ background:'#f7f7f7', padding: 12, borderRadius: 8 }}>{JSON.stringify(me, null, 2)}</pre>
  )
}
