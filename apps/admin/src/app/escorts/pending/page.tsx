'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPendingEscortsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/users?tab=escort-pending');
  }, [router]);

  return null;
}
