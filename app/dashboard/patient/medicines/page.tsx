'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { Medicine, Pharmacy, CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Pill, ShoppingCart, Plus, Minus, MapPin, Star, Clock } from 'lucide-react';
import { formatCurrency, haversineDistance } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function MedicinesPage() {
  const { profile } = useAuth();
  const [medicines, setMedicines] = React.useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = React.useState<Pharmacy[]>([]);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    (async () => {
      const [meds, pharms] = await Promise.all([
        supabase.from('medicines').select('*'),
        supabase.from('pharmacies').select('*'),
      ]);
      setMedicines(meds.data as Medicine[] || []);
      setPharmacies(pharms.data as Pharmacy[] || []);
      setLoading(false);
    })();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 28.6139, lng: 77.2090 })
      );
    }
  }, []);

  const categories = React.useMemo(() => {
    const cats = new Set(medicines.map(m => m.category).filter(Boolean));
    return ['all', ...Array.from(cats)] as string[];
  }, [medicines]);

  const filtered = React.useMemo(() => {
    return medicines.filter(m => {
      const matchSearch = !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.brand?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'all' || m.category === category;
      return matchSearch && matchCategory;
    });
  }, [medicines, search, category]);

  const getPharmacy = (id: string) => pharmacies.find(p => p.id === id);
  const getDistance = (pharmacy: Pharmacy | undefined) => {
    if (!pharmacy || !userLocation || !pharmacy.latitude || !pharmacy.longitude) return null;
    return haversineDistance(userLocation.lat, userLocation.lng, pharmacy.latitude, pharmacy.longitude);
  };

  const addToCart = (med: Medicine) => {
    setCart(prev => {
      const existing = prev.find(c => c.medicine_id === med.id);
      if (existing) {
        return prev.map(c => c.medicine_id === med.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { medicine_id: med.id, name: med.name, price: med.price, quantity: 1, prescription_required: med.prescription_required, pharmacy_id: med.pharmacy_id }];
    });
    toast.success(`${med.name} added to cart`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.medicine_id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <DashboardShell title="Medicines" description="Search and order medicines from nearby pharmacies">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filter */}
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Medicine Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading medicines...</p>
            ) : filtered.length > 0 ? (
              filtered.map(med => {
                const pharmacy = getPharmacy(med.pharmacy_id);
                const distance = getDistance(pharmacy);
                return (
                  <Card key={med.id} className="glass transition-all hover:shadow-lg">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{med.name}</h3>
                          <p className="text-xs text-muted-foreground">{med.brand} - {med.generic_name}</p>
                        </div>
                        {med.prescription_required && (
                          <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">Rx</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold">{formatCurrency(med.price)}</p>
                          {med.discount > 0 && <p className="text-xs text-success">{med.discount}% off</p>}
                        </div>
                        <Badge variant={med.quantity > 0 ? 'secondary' : 'destructive'} className={med.quantity > 0 ? 'bg-success/10 text-success' : ''}>
                          {med.quantity > 0 ? `${med.quantity} in stock` : 'Out of stock'}
                        </Badge>
                      </div>
                      {pharmacy && (
                        <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" /> {pharmacy.name}
                            {distance !== null && <span> - {distance} km</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3 w-3 fill-warning text-warning" /> {pharmacy.rating}
                            <span className="mx-1">-</span>
                            <Clock className="h-3 w-3" /> {pharmacy.is_24x7 ? '24x7' : pharmacy.is_open ? 'Open' : 'Closed'}
                          </div>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="mt-3 w-full bg-gradient-to-r from-primary to-accent text-white"
                        disabled={med.quantity === 0}
                        onClick={() => addToCart(med)}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No medicines found</p>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <Card className="glass sticky top-20 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length > 0 ? (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.medicine_id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.medicine_id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.medicine_id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">{formatCurrency(cartTotal)}</span>
                  </div>
                  <Button className="mt-3 w-full bg-gradient-to-r from-primary to-accent text-white">
                    Place Order
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Your cart is empty. Add medicines to get started.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
