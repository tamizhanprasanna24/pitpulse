'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { Medicine, Pharmacy } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, Plus, AlertCircle, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function PharmacyInventoryPage() {
  const { profile } = useAuth();
  const [medicines, setMedicines] = React.useState<Medicine[]>([]);
  const [pharmacy, setPharmacy] = React.useState<Pharmacy | null>(null);
  const [search, setSearch] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', brand: '', generic_name: '', quantity: '', price: '', prescription_required: false });

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: pharm } = await supabase.from('pharmacies').select('*').eq('owner_id', profile.id).maybeSingle();
      setPharmacy(pharm as Pharmacy | null);
      if (pharm) {
        const { data: meds } = await supabase.from('medicines').select('*').eq('pharmacy_id', pharm.id);
        setMedicines(meds as Medicine[] || []);
      }
    })();
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacy || !form.name) return;
    const { data, error } = await supabase.from('medicines').insert({ pharmacy_id: pharmacy.id, name: form.name, brand: form.brand || null, generic_name: form.generic_name || null, quantity: Number(form.quantity) || 0, price: Number(form.price) || 0, prescription_required: form.prescription_required }).select().single();
    if (error) { toast.error('Failed to add medicine'); }
    else { toast.success('Medicine added'); setMedicines(prev => [data as Medicine, ...prev]); setShowForm(false); setForm({ name: '', brand: '', generic_name: '', quantity: '', price: '', prescription_required: false }); }
  };

  const filtered = medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.brand?.toLowerCase().includes(search.toLowerCase()));
  const lowStock = filtered.filter(m => m.quantity < 50);

  return (
    <DashboardShell title="Inventory" description="Manage your medicine inventory">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-primary to-accent text-white"><Plus className="mr-1 h-4 w-4" /> Add Medicine</Button>
      </div>
      {showForm && (
        <Card className="glass mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input placeholder="Medicine name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              <Input placeholder="Generic name" value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
              <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              <Input type="number" placeholder="Price (Rs.)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <div className="flex items-center gap-2"><input type="checkbox" id="rx-inv" checked={form.prescription_required} onChange={(e) => setForm({ ...form, prescription_required: e.target.checked })} /><Label htmlFor="rx-inv" className="cursor-pointer text-sm">Prescription required</Label></div>
              <Button type="submit" className="sm:col-span-3 bg-gradient-to-r from-primary to-accent text-white">Add to Inventory</Button>
            </form>
          </CardContent>
        </Card>
      )}
      {lowStock.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/5 p-3 text-sm"><AlertCircle className="h-4 w-4 text-destructive" /><span className="text-muted-foreground">{lowStock.length} medicines are low on stock</span></div>
      )}
      <div className="space-y-2">
        {filtered.length > 0 ? filtered.map(m => (
          <Card key={m.id} className="glass">
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Pill className="h-4 w-4 text-primary" /></div>
                <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.brand} - {m.generic_name}</p></div>
              </div>
              <div className="flex items-center gap-4">
                {m.prescription_required && <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">Rx</Badge>}
                <span className="text-sm font-semibold">{formatCurrency(m.price)}</span>
                <Badge variant={m.quantity > 50 ? 'secondary' : 'destructive'} className={m.quantity > 50 ? 'bg-success/10 text-success' : ''}>{m.quantity} units</Badge>
              </div>
            </CardContent>
          </Card>
        )) : <Card className="glass"><CardContent className="flex flex-col items-center py-12"><Pill className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No medicines in inventory.</p></CardContent></Card>}
      </div>
    </DashboardShell>
  );
}
