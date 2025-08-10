// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /schedule when the homepage loads
    router.replace('/schedule');
  }, [router]);

  // Show loading message while redirecting
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Redirecting to Schedule Generator...</h1>
    </div>
  );
}