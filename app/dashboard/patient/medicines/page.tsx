'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { SAMPLE_MEDICINES } from '@/lib/medicine-catalog';
import type { Medicine, Pharmacy, CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Pill, ShoppingCart, Plus, Minus, MapPin, Star, Clock, AlertTriangle, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatCurrency, haversineDistance } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function MedicinesPage() {
  const { profile } = useAuth();
  const [medicines, setMedicines] = React.useState<Medicine[]>(SAMPLE_MEDICINES);
  const [pharmacies, setPharmacies] = React.useState<Pharmacy[]>([]);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [rxFilter, setRxFilter] = React.useState<'all' | 'otc' | 'rx'>('all');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [meds, pharms] = await Promise.all([
          supabase.from('medicines').select('*'),
          supabase.from('pharmacies').select('*'),
        ]);
        if (meds.data && meds.data.length > 0) setMedicines(meds.data as Medicine[]);
        if (pharms.data && pharms.data.length > 0) setPharmacies(pharms.data as Pharmacy[]);
      } catch {
        // Fallback SAMPLE_MEDICINES active
      } finally {
        setLoading(false);
      }
    })();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 28.6139, lng: 77.2090 })
      );
    }
  }, []);

  const activeMedicines = React.useMemo(() => {
    return medicines && medicines.length > 0 ? medicines : SAMPLE_MEDICINES;
  }, [medicines]);

  const categories = React.useMemo(() => {
    const cats = new Set(activeMedicines.map((m) => m.category).filter(Boolean));
    return ['all', ...Array.from(cats)] as string[];
  }, [activeMedicines]);

  const filtered = React.useMemo(() => {
    return activeMedicines.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.brand?.toLowerCase().includes(search.toLowerCase()) ||
        m.manufacturer?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'all' || m.category === category;
      const matchRx =
        rxFilter === 'all' ||
        (rxFilter === 'rx' && m.prescription_required) ||
        (rxFilter === 'otc' && !m.prescription_required);
      return matchSearch && matchCategory && matchRx;
    });
  }, [activeMedicines, search, category, rxFilter]);

  const getPharmacy = (id: string) => pharmacies.find((p) => p.id === id);

  const addToCart = (med: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.medicine_id === med.id);
      if (existing) {
        return prev.map((c) => (c.medicine_id === med.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          medicine_id: med.id,
          name: med.name,
          price: med.price,
          quantity: 1,
          prescription_required: med.prescription_required,
          pharmacy_id: med.pharmacy_id,
        },
      ];
    });
    toast.success(`${med.name} added to cart`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.medicine_id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const requiresRx = cart.some((item) => item.prescription_required);

  const handleCheckout = () => {
    if (requiresRx) {
      toast.info('Prescription Warning', {
        description: 'Your cart contains prescription-only (Rx) medicines. Verification required during checkout.',
      });
    } else {
      toast.success('Order placed successfully! Delivery partner assigned.');
    }
    setCart([]);
  };

  return (
    <DashboardShell title="Medicine Catalog & Delivery" description="Browse verified medicines, check prescription requirements, and order from local pharmacies">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filters */}
          <Card className="glass border-border/50">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medicine name, generic ingredient, or manufacturer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-52">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories (40)' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rx / OTC Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Filter Type:</span>
                <Button
                  size="sm"
                  variant={rxFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setRxFilter('all')}
                  className="h-7 text-xs rounded-full"
                >
                  All Medicines ({medicines.length})
                </Button>
                <Button
                  size="sm"
                  variant={rxFilter === 'otc' ? 'default' : 'outline'}
                  onClick={() => setRxFilter('otc')}
                  className="h-7 text-xs rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                >
                  <ShieldCheck className="mr-1 h-3 w-3" /> OTC (Self-Care)
                </Button>
                <Button
                  size="sm"
                  variant={rxFilter === 'rx' ? 'default' : 'outline'}
                  onClick={() => setRxFilter('rx')}
                  className="h-7 text-xs rounded-full border-amber-500/30 text-amber-600 dark:text-amber-400"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" /> Prescription Only (Rx)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Medicine Catalog Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.length > 0 ? (
              filtered.map((med) => (
                <Card key={med.id} className="glass hover:border-primary/40 transition-all flex flex-col justify-between">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-foreground leading-snug">{med.name}</h3>
                        <p className="text-xs text-muted-foreground">{med.brand} &bull; {med.generic_name}</p>
                      </div>
                      {med.prescription_required ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] shrink-0 font-bold">
                          <AlertTriangle className="mr-1 h-3 w-3" /> Rx Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 font-bold">
                          <ShieldCheck className="mr-1 h-3 w-3" /> OTC
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{med.description}</p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                      {med.form && (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium">
                          Form: {med.form}
                        </Badge>
                      )}
                      {med.strength && (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium">
                          Dose: {med.strength}
                        </Badge>
                      )}
                      {med.manufacturer && (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium">
                          {med.manufacturer}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div>
                        <span className="text-lg font-extrabold text-foreground">{formatCurrency(med.price)}</span>
                        {med.discount > 0 && <span className="ml-2 text-xs text-emerald-600 font-semibold">{med.discount}% OFF</span>}
                      </div>
                      <Badge variant={med.quantity > 0 ? 'secondary' : 'destructive'} className="text-[10px]">
                        {med.quantity > 0 ? `${med.quantity} in stock` : 'Out of Stock'}
                      </Badge>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-sm mt-1"
                      disabled={med.quantity === 0}
                      onClick={() => addToCart(med)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full p-8 text-center glass rounded-xl">
                <Pill className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-muted-foreground">No medicines matched your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart & Rx Verification Panel */}
        <div className="space-y-4">
          <Card className="glass sticky top-20 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Order Cart
                </span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length > 0 ? (
                <>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.medicine_id} className="flex items-center justify-between rounded-lg bg-card/60 p-2.5 border border-border/40">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">{formatCurrency(item.price)}</span>
                            {item.prescription_required && (
                              <span className="text-[10px] font-bold text-amber-500">Rx</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.medicine_id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.medicine_id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Prescription Warning Notice */}
                  {requiresRx && (
                    <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> Doctor Prescription Required
                      </div>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-snug">
                        One or more items require a valid doctor prescription. Pharmacist will verify upon fulfillment.
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border/50 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Subtotal:</span>
                      <span className="font-extrabold text-foreground">{formatCurrency(cartTotal)}</span>
                    </div>
                    <Button onClick={handleCheckout} className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-md">
                      Proceed to Checkout
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                  <Pill className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p>Your cart is empty. Add medicines from the catalog to place an order.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
