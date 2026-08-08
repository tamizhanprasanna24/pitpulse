'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { MedicineOrder } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Package } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/health-utils';

export default function DeliveryHistoryPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from('medicine_orders').select('*').eq('delivery_partner_id', profile.id).in('status', ['delivered', 'cancelled']).order('created_at', { ascending: false });
      setOrders(data as MedicineOrder[] || []);
    })();
  }, [profile]);

  return (
    <DashboardShell title="Delivery History" description="Your past deliveries">
      <div className="space-y-4">
        {orders.length > 0 ? orders.map(o => (
          <Card key={o.id} className="glass">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
                <div><h3 className="font-semibold text-sm">Order #{o.id.slice(0, 8)}</h3><p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatCurrency(o.total_amount)}</span>
                <Badge variant="secondary" className={o.status === 'delivered' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>{o.status}</Badge>
              </div>
            </CardContent>
          </Card>
        )) : <Card className="glass"><CardContent className="flex flex-col items-center py-12"><Package className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No delivery history yet.</p></CardContent></Card>}
      </div>
    </DashboardShell>
  );
}
