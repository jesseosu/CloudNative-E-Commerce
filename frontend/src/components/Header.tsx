import { Link } from 'react-router-dom';

export default function Header(){
  return (
    <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
      <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link to="/">Home</Link>
        <Link to="/cart">Cart</Link>
        <Link to="/checkout">Checkout</Link>
        <span style={{ marginLeft: 'auto' }} />
        <Link to="/login">Login</Link>
        <Link to="/profile">Profile</Link>
      </nav>
    </header>
  );
}
