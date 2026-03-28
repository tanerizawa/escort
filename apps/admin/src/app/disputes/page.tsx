'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDisputesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/bookings?tab=disputes');
  }, [router]);

  return null;
}
