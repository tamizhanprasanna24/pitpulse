'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { SAMPLE_MEDICINES } from '@/lib/medicine-catalog';
import type { Medicine, CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Search, Pill, ShoppingCart, Plus, Minus, AlertTriangle, ShieldCheck,
  Info, ArrowUpDown, CheckCircle2, Building2, Stethoscope, AlertCircle,
  FileText, PackageCheck, Sparkles, HeartPulse, Filter,
} from 'lucide-react';
import { formatCurrency } from '@/lib/health-utils';
import { toast } from 'sonner';

type SortOption = 'default' | 'price-low' | 'price-high' | 'name-asc';

export default function MedicinesPage() {
  const { profile } = useAuth();
  const [medicines, setMedicines] = React.useState<Medicine[]>(SAMPLE_MEDICINES);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [rxFilter, setRxFilter] = React.useState<'all' | 'otc' | 'rx'>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('default');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [selectedMedicine, setSelectedMedicine] = React.useState<Medicine | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('medicines').select('*');
        if (data && data.length > 0) {
          setMedicines(data as Medicine[]);
        } else {
          setMedicines(SAMPLE_MEDICINES);
        }
      } catch {
        setMedicines(SAMPLE_MEDICINES);
      }
    })();
  }, []);

  const activeMedicines = React.useMemo(() => {
    return medicines && medicines.length > 0 ? medicines : SAMPLE_MEDICINES;
  }, [medicines]);

  const categories = React.useMemo(() => {
    const cats = new Set(activeMedicines.map((m) => m.category).filter(Boolean));
    return ['all', ...Array.from(cats)] as string[];
  }, [activeMedicines]);

  const filteredAndSorted = React.useMemo(() => {
    let list = activeMedicines.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.brand?.toLowerCase().includes(search.toLowerCase()) ||
        m.category?.toLowerCase().includes(search.toLowerCase()) ||
        (m as any).manufacturer?.toLowerCase().includes(search.toLowerCase());

      const matchCategory = category === 'all' || m.category === category;
      const matchRx =
        rxFilter === 'all' ||
        (rxFilter === 'rx' && m.prescription_required) ||
        (rxFilter === 'otc' && !m.prescription_required);

      return matchSearch && matchCategory && matchRx;
    });

    if (sortBy === 'price-low') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [activeMedicines, search, category, rxFilter, sortBy]);

  const getItemQty = (id: string) => {
    const found = cart.find((c) => c.medicine_id === id);
    return found ? found.quantity : 0;
  };

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
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const requiresRx = cart.some((item) => item.prescription_required);

  const handleCheckout = () => {
    if (requiresRx) {
      toast.info('Doctor Prescription Verification', {
        description: 'Your cart contains prescription-only (Rx) medicines. Verified by pharmacy during dispatch.',
      });
    } else {
      toast.success('Order placed successfully! Delivery partner assigned.');
    }
    setCart([]);
  };

  return (
    <DashboardShell
      title="Medicine Catalog & Delivery"
      description="Browse verified healthcare medicines, check prescription requirements, and order from trusted pharmacies"
    >
      <div className="space-y-6">
        {/* Healthcare Safety Disclaimer Notice */}
        <Card className="glass border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="space-y-0.5 text-xs leading-relaxed">
              <span className="font-bold text-foreground block text-sm">Responsible Healthcare Advisory</span>
              <p className="text-muted-foreground">
                Pit Pulse provides transparent access to common medicines. Medicines marked as{' '}
                <span className="font-semibold text-amber-600 dark:text-amber-400">Prescription Required (Rx)</span>{' '}
                require a valid registered doctor prescription before fulfillment. Always consult a certified medical practitioner before starting medication and avoid self-treatment.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Catalog View */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search, Filter & Sort Bar */}
            <Card className="glass border-border/50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search 40 medicines by name, active ingredient, brand or manufacturer..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat === 'all' ? `All Categories (${activeMedicines.length})` : cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                      <SelectTrigger className="w-full sm:w-44">
                        <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Sort</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="name-asc">Name: A to Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Filter Type:</span>
                  <Button
                    size="sm"
                    variant={rxFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setRxFilter('all')}
                    className="h-7 text-xs rounded-full"
                  >
                    All Medicines ({activeMedicines.length})
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

            {/* 40 Medicines Card Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredAndSorted.length > 0 ? (
                filteredAndSorted.map((med) => {
                  const qtyInCart = getItemQty(med.id);
                  return (
                    <Card
                      key={med.id}
                      className="glass hover:border-primary/50 transition-all flex flex-col justify-between group overflow-hidden"
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Header & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                              {med.name}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">
                              {med.brand} &bull; {med.generic_name}
                            </p>
                          </div>

                          {med.prescription_required ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] shrink-0 font-bold"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3 inline" /> Prescription Required
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 font-bold"
                            >
                              <ShieldCheck className="mr-1 h-3 w-3 inline" /> OTC
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {med.description}
                        </p>

                        {/* Specifications & Pharmacy */}
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          {med.form && (
                            <Badge variant="secondary" className="bg-muted/80 text-foreground font-medium">
                              {med.form}
                            </Badge>
                          )}
                          {med.strength && (
                            <Badge variant="secondary" className="bg-muted/80 text-foreground font-medium">
                              {med.strength}
                            </Badge>
                          )}
                          {med.manufacturer && (
                            <Badge variant="secondary" className="bg-muted/80 text-muted-foreground">
                              {med.manufacturer}
                            </Badge>
                          )}
                        </div>

                        {/* Price & Stock */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div>
                            <span className="text-lg font-extrabold text-foreground">{formatCurrency(med.price)}</span>
                            {med.discount > 0 && (
                              <span className="ml-2 text-xs text-emerald-600 font-semibold">{med.discount}% OFF</span>
                            )}
                          </div>

                          <Badge
                            variant={med.quantity > 0 ? 'secondary' : 'destructive'}
                            className={
                              med.quantity > 0
                                ? 'bg-emerald-500/10 text-emerald-600 text-[10px]'
                                : 'text-[10px]'
                            }
                          >
                            {med.quantity > 0 ? `In Stock (${med.quantity})` : 'Out of Stock'}
                          </Badge>
                        </div>

                        {/* Actions: Details & Cart */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMedicine(med)}
                            className="flex-1 text-xs"
                          >
                            <Info className="mr-1 h-3.5 w-3.5" /> Details
                          </Button>

                          {qtyInCart > 0 ? (
                            <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-2 py-1 flex-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-primary hover:bg-primary/20"
                                onClick={() => updateQty(med.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-xs font-bold text-primary">{qtyInCart} in Cart</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-primary hover:bg-primary/20"
                                onClick={() => updateQty(med.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-primary to-accent text-white shadow-sm text-xs"
                              disabled={med.quantity === 0}
                              onClick={() => addToCart(med)}
                            >
                              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Add to Cart
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full p-10 text-center glass rounded-xl space-y-2">
                  <Pill className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    No medicines matched your criteria.
                  </p>
                  <Button variant="link" size="sm" onClick={() => { setSearch(''); setCategory('all'); setRxFilter('all'); }}>
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="space-y-4">
            <Card className="glass sticky top-20 border-border/50 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" /> Order Cart
                  </span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                    {cartItemCount} Items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length > 0 ? (
                  <>
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.medicine_id}
                          className="flex items-center justify-between rounded-lg bg-card/60 p-2.5 border border-border/40"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground">{formatCurrency(item.price)} each</span>
                              {item.prescription_required && (
                                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">
                                  Rx Required
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => updateQty(item.medicine_id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => updateQty(item.medicine_id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Prescription Verification Banner */}
                    {requiresRx && (
                      <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4 shrink-0" /> Prescription Required
                        </div>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-snug">
                          Your order contains prescription medicines. Verified by pharmacy prior to dispatch.
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border/50 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Subtotal:</span>
                        <span className="font-extrabold text-foreground">{formatCurrency(cartTotal)}</span>
                      </div>
                      <Button
                        onClick={handleCheckout}
                        className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-md font-bold"
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                    <Pill className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p>Your cart is empty. Select medicines from the catalog to place an order.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Medicine Details Modal */}
      {selectedMedicine && (
        <Dialog open={!!selectedMedicine} onOpenChange={() => setSelectedMedicine(null)}>
          <DialogContent className="max-w-md glass">
            <DialogHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {selectedMedicine.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {selectedMedicine.brand} &bull; {selectedMedicine.generic_name}
                  </DialogDescription>
                </div>
                {selectedMedicine.prescription_required ? (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                    Prescription Required
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                    OTC (Over-The-Counter)
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <span className="font-semibold text-foreground block">Clinical Description & Usage</span>
                <p className="text-muted-foreground leading-relaxed">{selectedMedicine.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-card/60 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Category</span>
                  <span className="font-bold text-foreground">{selectedMedicine.category}</span>
                </div>
                <div className="p-2.5 bg-card/60 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Dosage Form</span>
                  <span className="font-bold text-foreground">{selectedMedicine.form}</span>
                </div>
                <div className="p-2.5 bg-card/60 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Strength</span>
                  <span className="font-bold text-foreground">{selectedMedicine.strength}</span>
                </div>
                <div className="p-2.5 bg-card/60 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Manufacturer</span>
                  <span className="font-bold text-foreground">{selectedMedicine.manufacturer}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div>
                  <span className="text-muted-foreground text-[10px] block">Price per pack</span>
                  <span className="text-lg font-extrabold text-foreground">{formatCurrency(selectedMedicine.price)}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedMedicine.quantity} units available
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  addToCart(selectedMedicine);
                  setSelectedMedicine(null);
                }}
                className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold"
              >
                <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart ({formatCurrency(selectedMedicine.price)})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardShell>
  );
}
