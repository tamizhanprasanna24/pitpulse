'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardShell } from '@/components/dashboard/shell';
import type { Hospital, Pharmacy } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MapPin, Star, Clock, Phone, Navigation, Activity, Pill,
  Heart, Siren, Baby, Stethoscope, Building2, Cross, Filter,
} from 'lucide-react';
import { haversineDistance } from '@/lib/health-utils';

type PlaceType = 'all' | 'hospital' | 'pharmacy';

export default function MapsPage() {
  const [hospitals, setHospitals] = React.useState<Hospital[]>([]);
  const [pharmacies, setPharmacies] = React.useState<Pharmacy[]>([]);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [selectedType, setSelectedType] = React.useState<PlaceType>('all');
  const [hospitalFilter, setHospitalFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [h, p] = await Promise.all([
        supabase.from('hospitals').select('*'),
        supabase.from('pharmacies').select('*'),
      ]);
      setHospitals(h.data as Hospital[] || []);
      setPharmacies(p.data as Pharmacy[] || []);
      setLoading(false);
    })();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 28.6139, lng: 77.2090 })
      );
    } else {
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
    }
  }, []);

  React.useEffect(() => {
    if (!userLocation || mapLoaded) return;
    (async () => {
      const L = (await import('leaflet' as any)).default;
      await import('leaflet/dist/leaflet.css' as any);

      if (mapRef.current && !mapRef.current.hasChildNodes()) {
        const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '(c) OpenStreetMap contributors',
        }).addTo(map);

        L.marker([userLocation.lat, userLocation.lng], {
          icon: L.divIcon({ className: 'bg-primary', html: '<div style="background:hsl(199 89% 48%);width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.3)"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
        }).addTo(map).bindPopup('Your location');

        hospitals.forEach(h => {
          if (h.latitude && h.longitude) {
            const color = h.type === 'government' ? 'hsl(152 76% 40%)' : h.type === 'private' ? 'hsl(199 89% 48%)' : 'hsl(38 92% 50%)';
            L.marker([h.latitude, h.longitude], {
              icon: L.divIcon({ className: '', html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3)"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] }),
            }).addTo(map).bindPopup(`<b>${h.name}</b><br/>${h.type}<br/>${h.address}<br/>Phone: ${h.phone || 'N/A'}`);
          }
        });

        pharmacies.forEach(p => {
          if (p.latitude && p.longitude) {
            L.marker([p.latitude, p.longitude], {
              icon: L.divIcon({ className: '', html: '<div style="background:hsl(280 65% 60%);width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3)"></div>', iconSize: [14, 14], iconAnchor: [7, 7] }),
            }).addTo(map).bindPopup(`<b>${p.name}</b><br/>${p.address}<br/>Phone: ${p.phone || 'N/A'}`);
          }
        });

        setMapLoaded(true);
      }
    })();
  }, [userLocation, hospitals, pharmacies, mapLoaded]);

  const getDistance = (lat?: number | null, lng?: number | null) => {
    if (!userLocation || !lat || !lng) return null;
    return haversineDistance(userLocation.lat, userLocation.lng, lat, lng);
  };

  const filteredHospitals = hospitals.filter(h => {
    const matchFilter = hospitalFilter === 'all' || h.type === hospitalFilter;
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.address.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredPharmacies = pharmacies.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <DashboardShell title="Nearby Care" description="Find hospitals, pharmacies, and healthcare services near you">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <Card className="glass lg:col-span-2">
          <CardContent className="pt-6">
            <div ref={mapRef} className="h-[500px] w-full rounded-xl bg-muted" />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="glass">
            <CardContent className="pt-6 space-y-3">
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('all')}
                  className="flex-1"
                >All</Button>
                <Button
                  size="sm"
                  variant={selectedType === 'hospital' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('hospital')}
                  className="flex-1"
                >Hospitals</Button>
                <Button
                  size="sm"
                  variant={selectedType === 'pharmacy' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('pharmacy')}
                  className="flex-1"
                >Pharmacies</Button>
              </div>
              {selectedType === 'all' || selectedType === 'hospital' ? (
                <div className="flex flex-wrap gap-1">
                  {['all', 'government', 'private', 'clinic', 'phc'].map(f => (
                    <button
                      key={f}
                      onClick={() => setHospitalFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs capitalize ${hospitalFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    >
                      {f === 'all' ? 'All Types' : f}
                    </button>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {(selectedType === 'all' || selectedType === 'hospital') && filteredHospitals.map(h => {
              const dist = getDistance(h.latitude, h.longitude);
              return (
                <Card key={h.id} className="glass">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold">{h.name}</h3>
                        <p className="text-xs text-muted-foreground">{h.address}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">{h.type}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1"><Activity className="h-3 w-3 text-primary" /> ICU: {h.icu_beds_available}/{h.icu_beds_total}</div>
                      <div className="flex items-center gap-1"><Heart className="h-3 w-3 text-destructive" /> Gen: {h.general_beds_available}/{h.general_beds_total}</div>
                      <div className="flex items-center gap-1"><Siren className="h-3 w-3 text-warning" /> ER: {h.emergency_beds_available}/{h.emergency_beds_total}</div>
                      <div className="flex items-center gap-1"><Baby className="h-3 w-3 text-chart-4" /> Mat: {h.maternity_beds_available}/{h.maternity_beds_total}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /> {h.rating}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {h.waiting_time_min}m wait</span>
                        {dist !== null && <span>{dist} km</span>}
                      </div>
                      <Button size="sm" variant="ghost">
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {(selectedType === 'all' || selectedType === 'pharmacy') && filteredPharmacies.map(p => {
              const dist = getDistance(p.latitude, p.longitude);
              return (
                <Card key={p.id} className="glass">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">{p.address}</p>
                      </div>
                      <Badge variant="secondary" className={p.is_open ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>
                        {p.is_24x7 ? '24x7' : p.is_open ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /> {p.rating}</span>
                        {p.delivery_available && <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Delivery</Badge>}
                        {dist !== null && <span>{dist} km</span>}
                      </div>
                      <Button size="sm" variant="ghost">
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
