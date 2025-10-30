import { useState } from 'react';
import { login, userPool } from '../auth';

export default function Login(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Login / Sign Up</h2>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <div style={{ display:'flex', gap: 8, marginTop: 8 }}>
        <button onClick={async()=>{ try { const jwt = await login(email, password); alert('Logged in'); } catch(e:any){ alert(e.message); } }}>Login</button>
        <button onClick={async()=>{
          userPool.signUp(email, password, [], [], (err) => {
            if (err) alert(err.message);
            else alert('Sign up complete. Check email for confirmation.');
          });
        }}>Sign Up</button>
      </div>
    </div>
  );
}
