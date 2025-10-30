import { useEffect, useState } from 'react';
import { currentSessionJwt } from '../auth';

export default function Guard({ children }: { children: (jwt: string)=>JSX.Element }){
  const [jwt, setJwt] = useState<string|null>(null);
  useEffect(() => { currentSessionJwt().then(setJwt); }, []);
  if (jwt===null) return <p>Checking session…</p>;
  if (!jwt) return <p>Please log in to continue.</p>;
  return children(jwt);
}
