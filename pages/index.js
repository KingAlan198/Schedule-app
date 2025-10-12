// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tournament setup page when the homepage loads
    router.replace('/tournament-setup');
  }, [router]);

  // Show loading message while redirecting
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Setting up Tournament Creator...</h1>
    </div>
  );
}