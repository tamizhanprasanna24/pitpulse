'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { SAMPLE_MEDICINES } from '@/lib/medicine-catalog';
import type { Medicine, Pharmacy } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, Plus, AlertCircle, Search, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function PharmacyInventoryPage() {
  const { profile } = useAuth();
  const [medicines, setMedicines] = React.useState<Medicine[]>(SAMPLE_MEDICINES);
  const [pharmacy, setPharmacy] = React.useState<Pharmacy | null>(null);
  const [search, setSearch] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    brand: '',
    generic_name: '',
    quantity: '',
    price: '',
    prescription_required: false,
    form: 'Tablet',
    strength: '500 mg',
    manufacturer: 'Generic Pharma',
  });

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const { data: pharm } = await supabase.from('pharmacies').select('*').eq('owner_id', profile.id).maybeSingle();
        setPharmacy(pharm as Pharmacy | null);
        if (pharm) {
          const { data: meds } = await supabase.from('medicines').select('*').eq('pharmacy_id', pharm.id);
          if (meds && meds.length > 0) setMedicines(meds as Medicine[]);
        }
      } catch {
        // Fallback active
      }
    })();
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const newMed: Medicine = {
      id: 'med-' + Date.now(),
      pharmacy_id: pharmacy?.id || 'pharma-1',
      name: form.name,
      brand: form.brand || null,
      generic_name: form.generic_name || null,
      batch_number: 'BATCH-' + Math.floor(1000 + Math.random() * 9000),
      expiry_date: '2028-12-31',
      quantity: Number(form.quantity) || 0,
      price: Number(form.price) || 0,
      discount: 0,
      prescription_required: form.prescription_required,
      category: 'General Healthcare',
      description: 'Pharmacy inventory catalog medicine.',
      image_url: null,
      created_at: new Date().toISOString(),
      form: form.form,
      strength: form.strength,
      manufacturer: form.manufacturer,
    };

    setMedicines((prev) => [newMed, ...prev]);
    setShowForm(false);
    setForm({
      name: '',
      brand: '',
      generic_name: '',
      quantity: '',
      price: '',
      prescription_required: false,
      form: 'Tablet',
      strength: '500 mg',
      manufacturer: 'Generic Pharma',
    });
    toast.success(`${newMed.name} added to pharmacy inventory!`);
  };

  const filtered = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.brand?.toLowerCase().includes(search.toLowerCase()) ||
      m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.manufacturer?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = filtered.filter((m) => m.quantity < 50);

  return (
    <DashboardShell title="Pharmacy Inventory & Catalog" description="Manage stock, update prices, and configure prescription requirements for your pharmacy">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search catalog medicines by name, brand, generic or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-primary to-accent text-white">
          <Plus className="mr-1 h-4 w-4" /> Add Medicine
        </Button>
      </div>

      {showForm && (
        <Card className="glass mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                placeholder="Medicine name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="Brand name"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <Input
                placeholder="Generic compound"
                value={form.generic_name}
                onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Quantity in stock"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Price (₹)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <Input
                placeholder="Manufacturer"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              />
              <div className="flex items-center gap-2 sm:col-span-3">
                <input
                  type="checkbox"
                  id="rx"
                  checked={form.prescription_required}
                  onChange={(e) => setForm({ ...form, prescription_required: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="rx" className="text-xs font-semibold cursor-pointer">
                  Prescription Required (Rx Only)
                </Label>
              </div>
              <Button type="submit" className="sm:col-span-3 bg-primary text-primary-foreground">
                Save Medicine to Inventory
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {lowStock.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-warning text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Notice: {lowStock.length} items are running low on stock (&lt; 50 units).</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <Card key={m.id} className="glass hover:border-primary/40 transition-all">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{m.name}</h3>
                  <p className="text-xs text-muted-foreground">{m.brand} &bull; {m.generic_name}</p>
                </div>
                {m.prescription_required ? (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] shrink-0">
                    <AlertTriangle className="mr-1 h-3 w-3 inline" /> Rx
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
                    <ShieldCheck className="mr-1 h-3 w-3 inline" /> OTC
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2 rounded-lg">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-medium text-foreground">{m.category || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Form & Dose:</span>
                  <span className="font-medium text-foreground">{m.form} ({m.strength})</span>
                </div>
                <div className="flex justify-between">
                  <span>Manufacturer:</span>
                  <span className="font-medium text-foreground">{m.manufacturer || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-base font-extrabold text-foreground">{formatCurrency(m.price)}</span>
                <Badge variant={m.quantity > 50 ? 'secondary' : 'destructive'} className="text-[10px]">
                  Stock: {m.quantity}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
