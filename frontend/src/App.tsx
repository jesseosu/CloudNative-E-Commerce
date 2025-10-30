import { Outlet, Link } from 'react-router-dom';
import Header from './components/Header';

export default function App(){
  return (
    <div>
      <Header />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
        <Outlet />
      </main>
      <footer style={{ textAlign: 'center', padding: 24, opacity: 0.6 }}>
        Built with AWS: S3 + CloudFront + Cognito + API GW + Lambda + DynamoDB + Kinesis
      </footer>
    </div>
  );
}
