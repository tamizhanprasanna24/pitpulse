'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardShell } from '@/components/dashboard/shell';
import type { Hospital, Pharmacy } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Star, Clock, Navigation, Activity, Heart, Siren, Baby,
} from 'lucide-react';
import { haversineDistance } from '@/lib/health-utils';

type PlaceType = 'all' | 'hospital' | 'pharmacy';

const DEFAULT_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'Rampur Community Health Center (CHC)',
    type: 'government',
    address: 'Main Highway Road, Rampur Sector 2',
    latitude: 28.6145,
    longitude: 77.2095,
    phone: '+91 11 2345 6789',
    icu_beds_total: 12,
    icu_beds_available: 5,
    general_beds_total: 60,
    general_beds_available: 24,
    emergency_beds_total: 10,
    emergency_beds_available: 4,
    maternity_beds_total: 15,
    maternity_beds_available: 6,
    oxygen_available: true,
    ambulance_available: true,
    doctor_available: true,
    waiting_time_min: 15,
    rating: 4.6,
    created_at: new Date().toISOString(),
  },
  {
    id: 'hosp-2',
    name: 'City Care Multi-Specialty Hospital',
    type: 'private',
    address: 'Civil Lines, Near Metro Station, Rampur',
    latitude: 28.6180,
    longitude: 77.2150,
    phone: '+91 11 9876 5432',
    icu_beds_total: 25,
    icu_beds_available: 8,
    general_beds_total: 120,
    general_beds_available: 42,
    emergency_beds_total: 20,
    emergency_beds_available: 7,
    maternity_beds_total: 30,
    maternity_beds_available: 12,
    oxygen_available: true,
    ambulance_available: true,
    doctor_available: true,
    waiting_time_min: 10,
    rating: 4.8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'hosp-3',
    name: 'Sunrise Primary Health Center (PHC)',
    type: 'phc',
    address: 'Village Chowk, Rampur Rural Sub-District',
    latitude: 28.6090,
    longitude: 77.2020,
    phone: '+91 11 5555 1234',
    icu_beds_total: 4,
    icu_beds_available: 1,
    general_beds_total: 25,
    general_beds_available: 10,
    emergency_beds_total: 4,
    emergency_beds_available: 2,
    maternity_beds_total: 8,
    maternity_beds_available: 3,
    oxygen_available: true,
    ambulance_available: true,
    doctor_available: true,
    waiting_time_min: 5,
    rating: 4.4,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_PHARMACIES: Pharmacy[] = [
  {
    id: 'pharma-1',
    name: 'Apollo Lifecare Pharmacy (24x7)',
    owner_id: null,
    address: 'Shop 12, Main Market Road, Rampur',
    latitude: 28.6160,
    longitude: 77.2110,
    phone: '+91 98765 55555',
    is_24x7: true,
    is_open: true,
    rating: 4.9,
    delivery_available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pharma-2',
    name: 'Jan Aushadhi Kendra (Generic Medicines)',
    owner_id: null,
    address: 'Opposite CHC Hospital, Rampur',
    latitude: 28.6140,
    longitude: 77.2080,
    phone: '+91 98765 44444',
    is_24x7: false,
    is_open: true,
    rating: 4.7,
    delivery_available: true,
    created_at: new Date().toISOString(),
  },
];

export default function MapsPage() {
  const [hospitals, setHospitals] = React.useState<Hospital[]>(DEFAULT_HOSPITALS);
  const [pharmacies, setPharmacies] = React.useState<Pharmacy[]>(DEFAULT_PHARMACIES);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 });
  const [selectedType, setSelectedType] = React.useState<PlaceType>('all');
  const [hospitalFilter, setHospitalFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  React.useEffect(() => {
    // Inject Leaflet CSS dynamically into head
    if (!document.getElementById('leaflet-css-link')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-link';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    (async () => {
      try {
        const [h, p] = await Promise.all([
          supabase.from('hospitals').select('*'),
          supabase.from('pharmacies').select('*'),
        ]);
        if (h.data && h.data.length > 0) setHospitals(h.data as Hospital[]);
        if (p.data && p.data.length > 0) setPharmacies(p.data as Pharmacy[]);
      } catch {
        // Fallback data active
      }
    })();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 28.6139, lng: 77.2090 })
      );
    }
  }, []);

  React.useEffect(() => {
    if (!userLocation || mapLoaded) return;

    (async () => {
      const L = (await import('leaflet' as any)).default;

      if (mapRef.current && !mapRef.current.hasChildNodes()) {
        const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // User Location Pin
        L.marker([userLocation.lat, userLocation.lng], {
          icon: L.divIcon({
            className: 'custom-pin-user',
            html: '<div style="background:#0ea5e9;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(14,165,233,0.8)"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        }).addTo(map).bindPopup('<b>Your Location</b>');

        // Hospitals Pins
        hospitals.forEach((h) => {
          if (h.latitude && h.longitude) {
            const color = h.type === 'government' ? '#10b981' : h.type === 'private' ? '#0ea5e9' : '#f59e0b';
            L.marker([h.latitude, h.longitude], {
              icon: L.divIcon({
                className: 'custom-pin-hosp',
                html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,0.4)"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              }),
            }).addTo(map).bindPopup(`
              <div style="font-family:sans-serif;padding:2px">
                <b style="color:#0f172a">${h.name}</b><br/>
                <span style="color:#64748b;font-size:12px">${h.type.toUpperCase()} • ${h.address}</span><br/>
                <span style="color:#10b981;font-size:12px;font-weight:bold">ICU Beds: ${h.icu_beds_available}/${h.icu_beds_total}</span>
              </div>
            `);
          }
        });

        // Pharmacy Pins
        pharmacies.forEach((p) => {
          if (p.latitude && p.longitude) {
            L.marker([p.latitude, p.longitude], {
              icon: L.divIcon({
                className: 'custom-pin-pharma',
                html: '<div style="background:#8b5cf6;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(139,92,246,0.6)"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              }),
            }).addTo(map).bindPopup(`
              <div style="font-family:sans-serif;padding:2px">
                <b style="color:#0f172a">${p.name}</b><br/>
                <span style="color:#64748b;font-size:12px">${p.address}</span>
              </div>
            `);
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

  const filteredHospitals = hospitals.filter((h) => {
    const matchFilter = hospitalFilter === 'all' || h.type === hospitalFilter;
    const matchSearch =
      !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredPharmacies = pharmacies.filter((p) => {
    return (
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <DashboardShell title="Nearby Care" description="Find hospitals, pharmacies, and emergency services near you">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map View */}
        <Card className="glass lg:col-span-2 overflow-hidden border-border/50">
          <CardContent className="p-0">
            <div ref={mapRef} className="h-[520px] w-full bg-muted/30" />
          </CardContent>
        </Card>

        {/* Directory Sidebar */}
        <div className="space-y-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="Search hospital or pharmacy..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('all')}
                  className="flex-1 text-xs"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={selectedType === 'hospital' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('hospital')}
                  className="flex-1 text-xs"
                >
                  Hospitals
                </Button>
                <Button
                  size="sm"
                  variant={selectedType === 'pharmacy' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('pharmacy')}
                  className="flex-1 text-xs"
                >
                  Pharmacies
                </Button>
              </div>
              {(selectedType === 'all' || selectedType === 'hospital') && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {['all', 'government', 'private', 'clinic', 'phc'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setHospitalFilter(f)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] capitalize transition-colors ${
                        hospitalFilter === f
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'bg-muted text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {f === 'all' ? 'All Types' : f}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Directory Listings */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {(selectedType === 'all' || selectedType === 'hospital') &&
              filteredHospitals.map((h) => {
                const dist = getDistance(h.latitude, h.longitude);
                return (
                  <Card key={h.id} className="glass hover:border-primary/40 transition-all">
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-foreground">{h.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{h.address}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
                          {h.type}
                        </Badge>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs">
                        <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                          <Activity className="h-3 w-3" /> ICU: {h.icu_beds_available}/{h.icu_beds_total}
                        </div>
                        <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                          <Heart className="h-3 w-3" /> Gen: {h.general_beds_available}/{h.general_beds_total}
                        </div>
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Siren className="h-3 w-3" /> ER: {h.emergency_beds_available}/{h.emergency_beds_total}
                        </div>
                        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Baby className="h-3 w-3" /> Mat: {h.maternity_beds_available}/{h.maternity_beds_total}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-0.5 font-semibold text-amber-500">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {h.rating}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {h.waiting_time_min}m wait
                          </span>
                          {dist !== null && <span className="font-medium text-primary">{dist} km</span>}
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary">
                          <Navigation className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

            {(selectedType === 'all' || selectedType === 'pharmacy') &&
              filteredPharmacies.map((p) => {
                const dist = getDistance(p.latitude, p.longitude);
                return (
                  <Card key={p.id} className="glass hover:border-primary/40 transition-all">
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.address}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            p.is_open
                              ? 'bg-emerald-500/10 text-emerald-600 text-[10px]'
                              : 'bg-rose-500/10 text-rose-600 text-[10px]'
                          }
                        >
                          {p.is_24x7 ? '24x7 Open' : p.is_open ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-0.5 font-semibold text-amber-500">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {p.rating}
                          </span>
                          {p.delivery_available && (
                            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                              Medicine Delivery
                            </Badge>
                          )}
                          {dist !== null && <span className="font-medium text-primary">{dist} km</span>}
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary">
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
