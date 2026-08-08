'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { MedicineOrder } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Navigation, CheckCircle2, MapPin } from 'lucide-react';
import { formatCurrency, timeAgo, generateOTP } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function DeliveryOrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from('medicine_orders').select('*').or('status.eq.accepted,status.eq.preparing,status.eq.picked_up,status.eq.out_for_delivery').order('created_at', { ascending: false });
      setOrders(data as MedicineOrder[] || []);
    })();
  }, [profile]);

  const handlePickup = async (id: string) => {
    const otp = generateOTP();
    const { error } = await supabase.from('medicine_orders').update({ status: 'out_for_delivery', delivery_partner_id: profile?.id, otp }).eq('id', id);
    if (error) { toast.error('Failed'); } else { toast.success('Picked up! OTP: ' + otp); setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'out_for_delivery' as const, otp } : o)); }
  };
  const handleDeliver = async (id: string) => {
    const { error } = await supabase.from('medicine_orders').update({ status: 'delivered' }).eq('id', id);
    if (error) { toast.error('Failed'); } else { toast.success('Delivered!'); setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'delivered' as const } : o)); }
  };

  return (
    <DashboardShell title="Assigned Orders" description="View and manage your delivery assignments">
      <div className="space-y-4">
        {orders.length > 0 ? orders.map(o => (
          <Card key={o.id} className="glass">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3"><h3 className="font-semibold">Order #{o.id.slice(0, 8)}</h3><Badge variant="secondary" className={o.status === 'out_for_delivery' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}>{o.status.replace(/_/g, ' ')}</Badge>{o.is_emergency && <Badge variant="secondary" className="bg-destructive/10 text-destructive">Emergency</Badge>}</div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" /> {o.delivery_address || 'Address on file'}</p>
                  <p className="text-sm font-semibold">{formatCurrency(o.total_amount)} <span className="text-muted-foreground font-normal capitalize">- {o.payment_method}</span></p>
                  {o.otp && o.status === 'out_for_delivery' && <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-2 text-sm"><span className="text-muted-foreground">OTP:</span><span className="font-bold text-primary">{o.otp}</span></div>}
                  <p className="text-xs text-muted-foreground">{timeAgo(o.created_at)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {(o.status === 'accepted' || o.status === 'preparing') && <Button size="sm" onClick={() => handlePickup(o.id)} className="bg-gradient-to-r from-primary to-accent text-white"><Navigation className="mr-1 h-4 w-4" /> Mark Picked Up</Button>}
                  {o.status === 'out_for_delivery' && <Button size="sm" onClick={() => handleDeliver(o.id)} className="bg-success text-white"><CheckCircle2 className="mr-1 h-4 w-4" /> Mark Delivered</Button>}
                  <Button size="sm" variant="outline"><MapPin className="mr-1 h-4 w-4" /> Navigate</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : <Card className="glass"><CardContent className="flex flex-col items-center py-12"><Package className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No active deliveries assigned.</p></CardContent></Card>}
      </div>
    </DashboardShell>
  );
}
