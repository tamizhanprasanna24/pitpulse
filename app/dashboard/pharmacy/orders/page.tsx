'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { MedicineOrder, Pharmacy } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Package } from 'lucide-react';
import { formatCurrency, timeAgo } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function PharmacyOrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  const [pharmacy, setPharmacy] = React.useState<Pharmacy | null>(null);

  const fetchPharmacyOrders = React.useCallback(async () => {
    let remoteOrds: MedicineOrder[] = [];
    let localOrds: MedicineOrder[] = [];

    if (profile) {
      try {
        const { data: pharm } = await supabase.from('pharmacies').select('*').eq('owner_id', profile.id).maybeSingle();
        setPharmacy(pharm as Pharmacy | null);
        if (pharm) {
          const { data: ords } = await supabase.from('medicine_orders').select('*').eq('pharmacy_id', pharm.id).order('created_at', { ascending: false });
          if (ords) remoteOrds = ords as MedicineOrder[];
        }
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pitpulse_user_orders');
        if (saved) localOrds = JSON.parse(saved);
      } catch {
        // ignore
      }
    }

    const combinedMap = new Map<string, MedicineOrder>();
    localOrds.forEach(o => combinedMap.set(o.id, o));
    remoteOrds.forEach(o => combinedMap.set(o.id, o));

    setOrders(Array.from(combinedMap.values()));
  }, [profile]);

  React.useEffect(() => {
    fetchPharmacyOrders();
  }, [fetchPharmacyOrders]);

  const updateOrderStatus = (id: string, newStatus: MedicineOrder['status']) => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pitpulse_user_orders');
        if (saved) {
          const existing: MedicineOrder[] = JSON.parse(saved);
          const updated = existing.map(o => o.id === id ? { ...o, status: newStatus } : o);
          localStorage.setItem('pitpulse_user_orders', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
    }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const handleAccept = async (id: string) => {
    try { await supabase.from('medicine_orders').update({ status: 'accepted' }).eq('id', id); } catch {}
    updateOrderStatus(id, 'accepted');
    toast.success('Order accepted! Dispatched for packaging.');
  };

  const handleReject = async (id: string) => {
    try { await supabase.from('medicine_orders').update({ status: 'rejected' }).eq('id', id); } catch {}
    updateOrderStatus(id, 'rejected');
    toast.success('Order rejected');
  };

  return (
    <DashboardShell title="Orders" description="Manage incoming medicine orders">
      <div className="space-y-4">
        {orders.length > 0 ? orders.map(o => (
          <Card key={o.id} className="glass">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Order #{o.id.slice(0, 8)}</h3>
                <p className="text-xs text-muted-foreground">{formatCurrency(o.total_amount)} - {timeAgo(o.created_at)}</p>
                <p className="text-xs text-muted-foreground capitalize">{o.payment_method} - {o.payment_status}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={o.status === 'delivered' ? 'bg-success/10 text-success' : o.status === 'rejected' || o.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}>{o.status.replace(/_/g, ' ')}</Badge>
                {o.status === 'placed' && (<><Button size="sm" variant="ghost" onClick={() => handleAccept(o.id)}><Check className="h-4 w-4 text-success" /></Button><Button size="sm" variant="ghost" onClick={() => handleReject(o.id)}><X className="h-4 w-4 text-destructive" /></Button></>)}
              </div>
            </CardContent>
          </Card>
        )) : <Card className="glass"><CardContent className="flex flex-col items-center py-12"><Package className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No orders yet.</p></CardContent></Card>}
      </div>
    </DashboardShell>
  );
}
