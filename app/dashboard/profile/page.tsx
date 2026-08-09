'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import DoctorProfilePage from '@/app/dashboard/doctor/profile/page';
import AshaProfilePage from '@/app/dashboard/asha-worker/profile/page';
import PharmacyProfilePage from '@/app/dashboard/pharmacy/profile/page';
import DeliveryProfilePage from '@/app/dashboard/delivery/profile/page';
import PatientProfilePage from '@/app/dashboard/patient/profile/page';

export default function UnifiedProfilePage() {
  const { profile } = useAuth();
  const router = useRouter();

  const role = profile?.role || 'patient';

  switch (role) {
    case 'doctor':
      return <DoctorProfilePage />;
    case 'asha':
      return <AshaProfilePage />;
    case 'pharmacy':
      return <PharmacyProfilePage />;
    case 'delivery':
      return <DeliveryProfilePage />;
    default:
      return <PatientProfilePage />;
  }
}
