'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, StatCard, SectionCard } from '@/components/dashboard/shell';
import type { Medicine, MedicineOrder, Pharmacy } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, Package, TrendingUp, Star, Plus, Minus, AlertCircle, Check, X, Truck } from 'lucide-react';
import { formatCurrency, timeAgo } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function PharmacyDashboard() {
  const { profile } = useAuth();
  const [medicines, setMedicines] = React.useState<Medicine[]>([]);
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  const [pharmacy, setPharmacy] = React.useState<Pharmacy | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAddMed, setShowAddMed] = React.useState(false);
  const [newMed, setNewMed] = React.useState({ name: '', brand: '', generic_name: '', quantity: '', price: '', prescription_required: false });

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: pharmData } = await supabase.from('pharmacies').select('*').eq('owner_id', profile.id).maybeSingle();
      setPharmacy(pharmData as Pharmacy | null);

      if (pharmData) {
        const [meds, ords] = await Promise.all([
          supabase.from('medicines').select('*').eq('pharmacy_id', pharmData.id),
          supabase.from('medicine_orders').select('*').eq('pharmacy_id', pharmData.id).order('created_at', { ascending: false }),
        ]);
        setMedicines(meds.data as Medicine[] || []);
        setOrders(ords.data as MedicineOrder[] || []);
      }
      setLoading(false);
    })();
  }, [profile]);

  const handleAccept = async (orderId: string) => {
    const { error } = await supabase.from('medicine_orders').update({ status: 'accepted' }).eq('id', orderId);
    if (error) { toast.error('Failed to accept order'); }
    else { toast.success('Order accepted'); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'accepted' as const } : o)); }
  };

  const handleReject = async (orderId: string) => {
    const { error } = await supabase.from('medicine_orders').update({ status: 'rejected' }).eq('id', orderId);
    if (error) { toast.error('Failed to reject order'); }
    else { toast.success('Order rejected'); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' as const } : o)); }
  };

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacy || !newMed.name) return;
    const { data, error } = await supabase.from('medicines').insert({
      pharmacy_id: pharmacy.id,
      name: newMed.name,
      brand: newMed.brand || null,
      generic_name: newMed.generic_name || null,
      quantity: Number(newMed.quantity) || 0,
      price: Number(newMed.price) || 0,
      prescription_required: newMed.prescription_required,
    }).select().single();
    if (error) { toast.error('Failed to add medicine'); }
    else { toast.success('Medicine added'); setMedicines(prev => [data as Medicine, ...prev]); setShowAddMed(false); setNewMed({ name: '', brand: '', generic_name: '', quantity: '', price: '', prescription_required: false }); }
  };

  const lowStock = medicines.filter(m => m.quantity < 50);
  const totalSales = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <DashboardShell title="Pharmacy Dashboard" description="Manage inventory and orders">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Pill} label="Total Medicines" value={medicines.length} color="bg-primary" />
        <StatCard icon={Package} label="Pending Orders" value={orders.filter(o => o.status === 'placed').length} color="bg-warning" />
        <StatCard icon={TrendingUp} label="Total Sales" value={formatCurrency(totalSales)} color="bg-success" />
        <StatCard icon={AlertCircle} label="Low Stock" value={lowStock.length} color="bg-destructive" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Recent Orders" action={<Button variant="ghost" size="sm">View All</Button>}>
          <div className="space-y-3">
            {orders.length > 0 ? orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
                <div>
                  <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(order.total_amount)} - {timeAgo(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={
                    order.status === 'delivered' ? 'bg-success/10 text-success' :
                    order.status === 'cancelled' || order.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }>{order.status.replace(/_/g, ' ')}</Badge>
                  {order.status === 'placed' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleAccept(order.id)}><Check className="h-4 w-4 text-success" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleReject(order.id)}><X className="h-4 w-4 text-destructive" /></Button>
                    </>
                  )}
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No orders yet</p>}
          </div>
        </SectionCard>

        <SectionCard title="Low Stock Alerts">
          <div className="space-y-3">
            {lowStock.length > 0 ? lowStock.map(med => (
              <div key={med.id} className="flex items-center justify-between rounded-lg bg-destructive/5 p-3">
                <div>
                  <p className="text-sm font-medium">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.brand}</p>
                </div>
                <Badge variant="secondary" className="bg-destructive/10 text-destructive">{med.quantity} left</Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground">All medicines well stocked</p>}
          </div>
        </SectionCard>
      </div>

      <Card className="glass mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Management</CardTitle>
            <Button size="sm" onClick={() => setShowAddMed(!showAddMed)} className="bg-gradient-to-r from-primary to-accent text-white">
              <Plus className="mr-1 h-4 w-4" /> Add Medicine
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddMed && (
            <form onSubmit={handleAddMed} className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-card/50 p-4 sm:grid-cols-3">
              <Input placeholder="Medicine name" value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} required />
              <Input placeholder="Brand" value={newMed.brand} onChange={(e) => setNewMed({ ...newMed, brand: e.target.value })} />
              <Input placeholder="Generic name" value={newMed.generic_name} onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })} />
              <Input type="number" placeholder="Quantity" value={newMed.quantity} onChange={(e) => setNewMed({ ...newMed, quantity: e.target.value })} />
              <Input type="number" placeholder="Price" value={newMed.price} onChange={(e) => setNewMed({ ...newMed, price: e.target.value })} />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="rx" checked={newMed.prescription_required} onChange={(e) => setNewMed({ ...newMed, prescription_required: e.target.checked })} />
                <Label htmlFor="rx">Prescription required</Label>
              </div>
              <Button type="submit" size="sm" className="sm:col-span-3 bg-gradient-to-r from-primary to-accent text-white">Add to Inventory</Button>
            </form>
          )}
          <div className="space-y-2">
            {medicines.length > 0 ? medicines.map(med => (
              <div key={med.id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Pill className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.brand} - {med.generic_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {med.prescription_required && <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">Rx</Badge>}
                  <span className="text-sm font-semibold">{formatCurrency(med.price)}</span>
                  <Badge variant={med.quantity > 50 ? 'secondary' : 'destructive'} className={med.quantity > 50 ? 'bg-success/10 text-success' : ''}>
                    {med.quantity} units
                  </Badge>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No medicines in inventory. Add medicines to get started.</p>}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
