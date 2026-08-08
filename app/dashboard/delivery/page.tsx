'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, StatCard, SectionCard } from '@/components/dashboard/shell';
import type { MedicineOrder, DeliveryPartner } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Truck, Package, MapPin, Phone, Star, Navigation, CheckCircle2, Wallet, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDateTime, timeAgo, generateOTP } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function DeliveryDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  const [partner, setPartner] = React.useState<DeliveryPartner | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: partnerData } = await supabase.from('delivery_partners').select('*').eq('profile_id', profile.id).maybeSingle();
      setPartner(partnerData as DeliveryPartner | null);

      const { data: orderData } = await supabase
        .from('medicine_orders')
        .select('*')
        .or(`delivery_partner_id.eq.${profile.id},status.eq.accepted,status.eq.preparing,status.eq.picked_up,status.eq.out_for_delivery`)
        .order('created_at', { ascending: false });
      setOrders(orderData as MedicineOrder[] || []);
      setLoading(false);
    })();
  }, [profile]);

  const toggleAvailability = async () => {
    if (!partner || !profile) return;
    const { error } = await supabase.from('delivery_partners').update({ is_available: !partner.is_available }).eq('profile_id', profile.id);
    if (error) { toast.error('Failed to update status'); }
    else { setPartner({ ...partner, is_available: !partner.is_available }); toast.success(partner.is_available ? 'You are now offline' : 'You are now online'); }
  };

  const handlePickup = async (orderId: string) => {
    const otp = generateOTP();
    const { error } = await supabase.from('medicine_orders').update({ status: 'out_for_delivery', delivery_partner_id: profile?.id, otp }).eq('id', orderId);
    if (error) { toast.error('Failed to update order'); }
    else { toast.success(`Picked up! OTP: ${otp}`); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'out_for_delivery' as const, otp } : o)); }
  };

  const handleDeliver = async (orderId: string) => {
    const { error } = await supabase.from('medicine_orders').update({ status: 'delivered' }).eq('id', orderId);
    if (error) { toast.error('Failed to update order'); }
    else { toast.success('Order delivered!'); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' as const } : o)); }
  };

  return (
    <DashboardShell title="Delivery Partner Dashboard" description="Manage your deliveries and earnings">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Package} label="Active Orders" value={orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} color="bg-primary" />
        <StatCard icon={CheckCircle2} label="Completed" value={partner?.total_deliveries || 0} color="bg-success" />
        <StatCard icon={Wallet} label="Earnings" value={formatCurrency(partner?.total_earnings || 0)} color="bg-accent" />
        <StatCard icon={Star} label="Rating" value={partner?.rating?.toFixed(1) || '5.0'} color="bg-warning" />
      </div>

      <Card className="glass mt-6">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${partner?.is_available ? 'bg-success/10' : 'bg-muted'}`}>
              <Truck className={`h-6 w-6 ${partner?.is_available ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="font-semibold">Availability Status</h3>
              <p className="text-sm text-muted-foreground">{partner?.is_available ? 'You are online and ready for deliveries' : 'You are currently offline'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{partner?.is_available ? 'Online' : 'Offline'}</span>
            <Switch checked={partner?.is_available || false} onCheckedChange={toggleAvailability} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-semibold">Assigned Orders</h2>
        {orders.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">No active deliveries. Check back later for new assignments.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map(order => (
            <Card key={order.id} className="glass">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                      <Badge variant="secondary" className={
                        order.status === 'delivered' ? 'bg-success/10 text-success' :
                        order.status === 'out_for_delivery' ? 'bg-primary/10 text-primary' :
                        'bg-warning/10 text-warning'
                      }>{order.status.replace(/_/g, ' ')}</Badge>
                      {order.is_emergency && <Badge variant="secondary" className="bg-destructive/10 text-destructive">Emergency</Badge>}
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {order.delivery_address || 'Address on file'}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground">{formatCurrency(order.total_amount)}</span>
                        <span>-</span>
                        <span className="capitalize">{order.payment_method}</span>
                      </div>
                    </div>
                    {order.otp && order.status === 'out_for_delivery' && (
                      <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-2 text-sm">
                        <span className="text-muted-foreground">Delivery OTP:</span>
                        <span className="font-bold text-primary">{order.otp}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {order.status === 'accepted' || order.status === 'preparing' ? (
                      <Button size="sm" onClick={() => handlePickup(order.id)} className="bg-gradient-to-r from-primary to-accent text-white">
                        <Navigation className="mr-1 h-4 w-4" /> Mark Picked Up
                      </Button>
                    ) : order.status === 'out_for_delivery' ? (
                      <Button size="sm" onClick={() => handleDeliver(order.id)} className="bg-success text-white">
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Mark Delivered
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline">
                      <MapPin className="mr-1 h-4 w-4" /> Navigate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
