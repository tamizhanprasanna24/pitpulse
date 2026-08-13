'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { MedicineOrder, MedicineOrderItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/health-utils';
import { Package, Truck, CheckCircle2, Clock, XCircle, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

const statusSteps = ['placed', 'accepted', 'preparing', 'picked_up', 'out_for_delivery', 'delivered'];

const initialSampleOrders: MedicineOrder[] = [
  {
    id: 'ORD-882194',
    patient_id: 'usr-pat-1',
    pharmacy_id: 'pharma-1',
    delivery_partner_id: 'usr-deliv-1',
    status: 'out_for_delivery',
    total_amount: 450,
    delivery_address: '12, Gandhi Road, Mylapore, Chennai',
    delivery_latitude: 13.03118,
    delivery_longitude: 80.27838,
    payment_method: 'upi',
    payment_status: 'paid',
    is_emergency: false,
    otp: '4829',
    scheduled_delivery: null,
    prescription_url: null,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ORD-771045',
    patient_id: 'usr-pat-1',
    pharmacy_id: 'pharma-1',
    delivery_partner_id: 'usr-deliv-1',
    status: 'delivered',
    total_amount: 280,
    delivery_address: '12, Gandhi Road, Mylapore, Chennai',
    delivery_latitude: 13.03118,
    delivery_longitude: 80.27838,
    payment_method: 'cod',
    payment_status: 'paid',
    is_emergency: false,
    otp: '9102',
    scheduled_delivery: null,
    prescription_url: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export default function OrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  const [items, setItems] = React.useState<Record<string, MedicineOrderItem[]>>({});
  const [loading, setLoading] = React.useState(true);

  const fetchOrders = React.useCallback(async () => {
    let remoteOrders: MedicineOrder[] = [];
    let localOrders: MedicineOrder[] = [];

    // 1. Fetch remote orders from Supabase
    if (profile) {
      try {
        const { data } = await supabase
          .from('medicine_orders')
          .select('*')
          .eq('patient_id', profile.id)
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          remoteOrders = data as MedicineOrder[];
        }
      } catch {
        // ignore
      }
    }

    // 2. Fetch local orders from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pitpulse_user_orders');
        if (saved) {
          localOrders = JSON.parse(saved);
        }
      } catch {
        // ignore
      }
    }

    // Combine & deduplicate orders
    const combinedMap = new Map<string, MedicineOrder>();
    localOrders.forEach(o => combinedMap.set(o.id, o));
    remoteOrders.forEach(o => combinedMap.set(o.id, o));

    const combinedList = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (combinedList.length > 0) {
      setOrders(combinedList);
    } else {
      setOrders(initialSampleOrders);
    }
    setLoading(false);
  }, [profile]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStepIndex = (status: string) => statusSteps.indexOf(status);

  const handleCancel = async (orderId: string) => {
    try {
      await supabase
        .from('medicine_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pitpulse_user_orders');
        if (saved) {
          const existing: MedicineOrder[] = JSON.parse(saved);
          const updated = existing.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o);
          localStorage.setItem('pitpulse_user_orders', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
    }

    toast.success('Order cancelled');
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o));
  };

  return (
    <DashboardShell title="My Orders" description="Track your medicine orders">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading orders...</p>
      ) : orders.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No orders yet. Order medicines from the Medicines page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const stepIndex = getStepIndex(order.status);
            const isCancelled = order.status === 'cancelled';
            const isDelivered = order.status === 'delivered';
            return (
              <Card key={order.id} className="glass">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                        <Badge variant="secondary" className={
                          isDelivered ? 'bg-success/10 text-success' :
                          isCancelled ? 'bg-destructive/10 text-destructive' :
                          'bg-warning/10 text-warning'
                        }>
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                        {order.is_emergency && <Badge variant="secondary" className="bg-destructive/10 text-destructive">Emergency</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="font-bold">{formatCurrency(order.total_amount)}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-muted-foreground capitalize">{order.payment_method}</span>
                        <Badge variant="secondary" className={
                          order.payment_status === 'paid' ? 'bg-success/10 text-success' :
                          order.payment_status === 'failed' ? 'bg-destructive/10 text-destructive' : ''
                        }>{order.payment_status}</Badge>
                      </div>
                    </div>
                    {!isCancelled && !isDelivered && (
                      <Button variant="outline" size="sm" onClick={() => handleCancel(order.id)}>
                        Cancel Order
                      </Button>
                    )}
                  </div>

                  {/* Order Timeline */}
                  {!isCancelled && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between">
                        {statusSteps.map((step, i) => (
                          <div key={step} className="flex flex-1 flex-col items-center">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              i <= stepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                              {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> :
                               i === stepIndex ? <Truck className="h-4 w-4" /> :
                               <Clock className="h-3 w-3" />}
                            </div>
                            <span className={`mt-1 text-xs ${i <= stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 h-1 -translate-y-12 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(stepIndex / (statusSteps.length - 1)) * 100}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Delivery Info */}
                  {order.status === 'out_for_delivery' && (
                    <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary/5 p-3">
                      <Truck className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Out for delivery</p>
                        <p className="text-xs text-muted-foreground">OTP: {order.otp || '------'}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <MapPin className="mr-1 h-4 w-4" /> Track Live
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
