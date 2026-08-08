'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pill, Search, Loader2, Plus, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/health-utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Medicine {
  id: string;
  name: string;
  brand: string | null;
  generic_name: string | null;
  category: string | null;
  price: number;
  quantity: number;
  prescription_required: boolean;
  description: string | null;
}

export default function PharmacyCataloguePage() {
  const { profile } = useAuth();
  const [medicines, setMedicines] = React.useState<Medicine[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', brand: '', generic_name: '', category: '', price: '', quantity: '', description: '', prescription_required: false });

  const fetchMedicines = React.useCallback(async () => {
    if (!profile?.pharmacy_id) return;
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('pharmacy_id', profile.pharmacy_id)
      .order('name', { ascending: true });
    if (error) {
      toast.error('Failed to load catalogue');
      return;
    }
    setMedicines((data as Medicine[]) || []);
    setLoading(false);
  }, [profile]);

  React.useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.pharmacy_id) return;
    setSubmitting(true);
    const { error } = await supabase.from('medicines').insert({
      pharmacy_id: profile.pharmacy_id,
      name: form.name,
      brand: form.brand || null,
      generic_name: form.generic_name || null,
      category: form.category || null,
      price: Number(form.price) || 0,
      quantity: Number(form.quantity) || 0,
      description: form.description || null,
      prescription_required: form.prescription_required,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Failed to add medicine');
      return;
    }
    toast.success('Medicine added to catalogue');
    setForm({ name: '', brand: '', generic_name: '', category: '', price: '', quantity: '', description: '', prescription_required: false });
    setDialogOpen(false);
    fetchMedicines();
  };

  const filtered = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.brand?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (m.category?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <DashboardShell title="Medicine Catalogue" description="Browse and manage your pharmacy catalogue">
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search catalogue..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Medicine</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Medicine Name</Label>
                  <Input id="name" placeholder="Paracetamol 500mg" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" placeholder="Crocin" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="generic">Generic Name</Label>
                    <Input id="generic" placeholder="Paracetamol" value={form.generic_name} onChange={e => setForm({ ...form, generic_name: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" placeholder="Pain Relief" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qty">Quantity in Stock</Label>
                    <Input id="qty" type="number" placeholder="100" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (Rs.)</Label>
                  <Input id="price" type="number" step="0.01" placeholder="25.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input id="desc" placeholder="For fever and pain relief" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.prescription_required} onChange={e => setForm({ ...form, prescription_required: e.target.checked })} />
                  Prescription Required
                </label>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-primary to-accent text-white">
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{search ? 'No medicines match your search.' : 'No medicines in catalogue yet. Add your first one.'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(m => (
              <Card key={m.id} className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Pill className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{m.name}</h3>
                        <p className="text-xs text-muted-foreground">{m.brand || m.generic_name || m.category || 'General'}</p>
                      </div>
                    </div>
                    {m.prescription_required && <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">Rx</Badge>}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{m.description || 'No description available'}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-sm">{formatCurrency(m.price)}</span>
                    <Badge variant="secondary" className={m.quantity > 10 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>
                      {m.quantity} in stock
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
