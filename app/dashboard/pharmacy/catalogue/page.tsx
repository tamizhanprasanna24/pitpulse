'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { SAMPLE_MEDICINES } from '@/lib/medicine-catalog';
import type { Medicine } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pill, Search, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/health-utils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

export default function PharmacyCataloguePage() {
  const { profile } = useAuth();
  const [medicines, setMedicines] = React.useState<Medicine[]>(SAMPLE_MEDICINES);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const fetchMedicines = React.useCallback(async () => {
    try {
      const { data, error } = await supabase.from('medicines').select('*').order('name', { ascending: true });
      if (data && data.length > 0) {
        setMedicines(data as Medicine[]);
      }
    } catch {
      // Fallback active
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.category?.toLowerCase().includes(search.toLowerCase()) ||
      m.manufacturer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell title="Medicine Catalogue" description="Master catalog of 40 standard medicines with OTC & Prescription (Rx) classifications">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search master catalog by name, active ingredient, category, or manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="w-fit bg-primary/10 text-primary py-1 px-3">
            Total Catalog: {medicines.length} Medicines
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMedicines.map((med) => (
            <Card key={med.id} className="glass hover:border-primary/40 transition-all flex flex-col justify-between">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{med.name}</h3>
                    <p className="text-xs text-muted-foreground">{med.brand} &bull; {med.generic_name}</p>
                  </div>
                  {med.prescription_required ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] shrink-0 font-bold">
                      <AlertTriangle className="mr-1 h-3 w-3 inline" /> Rx Required
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 font-bold">
                      <ShieldCheck className="mr-1 h-3 w-3 inline" /> OTC
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{med.description}</p>

                <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium text-foreground">{med.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Form & Strength:</span>
                    <span className="font-medium text-foreground">{med.form || 'Tablet'} ({med.strength || 'Standard'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manufacturer:</span>
                    <span className="font-medium text-foreground">{med.manufacturer || 'Standard Pharma'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-base font-extrabold text-foreground">{formatCurrency(med.price)}</span>
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                    Stock: {med.quantity}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
