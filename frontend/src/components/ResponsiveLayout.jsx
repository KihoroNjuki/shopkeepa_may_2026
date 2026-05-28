import { useEffect, useState } from 'react';
import Layout from './Layout';
import MobileLayout from './MobileLayout';

export default function ResponsiveLayout({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile
    ? <MobileLayout>{children}</MobileLayout>
    : <Layout>{children}</Layout>;
}