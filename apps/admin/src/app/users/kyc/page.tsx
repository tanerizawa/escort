'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminKycPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/users?tab=kyc');
  }, [router]);

  return null;
}
