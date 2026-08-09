'use client';

import * as React from 'react';
import type { MedicineOrder } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Truck, Store, Home, Compass } from 'lucide-react';

interface DeliveryMapProps {
  order: MedicineOrder | null;
  userLocation: { lat: number; lng: number };
}

export function DeliveryMap({ order, userLocation }: DeliveryMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const leafletMapRef = React.useRef<any>(null);

  const pharmacyCoords = {
    lat: userLocation.lat - 0.006,
    lng: userLocation.lng - 0.008,
  };

  const patientCoords = {
    lat: userLocation.lat + 0.008,
    lng: userLocation.lng + 0.010,
  };

  React.useEffect(() => {
    if (!mapRef.current) return;

    if (!document.getElementById('leaflet-css-link')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-link';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    (async () => {
      const L = (await import('leaflet' as any)).default;

      if (!leafletMapRef.current) {
        const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        leafletMapRef.current = map;
      }

      const map = leafletMapRef.current;

      // Clear layers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // 1. Pharmacy Pin
      L.marker([pharmacyCoords.lat, pharmacyCoords.lng], {
        icon: L.divIcon({
          className: 'pin-pharmacy',
          html: `<div style="background:#8b5cf6;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px rgba(139,92,246,0.8);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold">🏪</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map).bindPopup('<b>Apollo Pharmacy</b><br/>Pickup Point');

      // 2. Delivery Partner Live GPS Pin
      L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          className: 'pin-delivery',
          html: `<div style="position:relative;display:flex;align-items:center;justify-content:center">
                  <div style="position:absolute;width:34px;height:34px;background:rgba(14,165,233,0.3);border-radius:50%;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite"></div>
                  <div style="background:#0ea5e9;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 0 12px rgba(14,165,233,0.9);display:flex;align-items:center;justify-content:center;color:white;font-size:11px">🛵</div>
                </div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      }).addTo(map).bindPopup('<b>Your Live GPS Location</b><br/>Delivery Partner');

      // 3. Patient Destination Pin
      L.marker([patientCoords.lat, patientCoords.lng], {
        icon: L.divIcon({
          className: 'pin-patient',
          html: `<div style="background:#10b981;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px rgba(16,185,129,0.8);display:flex;align-items:center;justify-content:center;color:white;font-size:11px">🏠</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map).bindPopup(`<b>${order?.delivery_address || 'Patient Doorstep'}</b><br/>Drop-off Destination`);

      // 4. Draw Route Polylines
      const routeLatLnts = [
        [pharmacyCoords.lat, pharmacyCoords.lng],
        [userLocation.lat, userLocation.lng],
        [patientCoords.lat, patientCoords.lng],
      ];

      L.polyline(routeLatLnts, {
        color: '#0ea5e9',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      map.fitBounds([
        [pharmacyCoords.lat, pharmacyCoords.lng],
        [patientCoords.lat, patientCoords.lng],
      ], { padding: [40, 40] });

    })();
  }, [order, userLocation]);

  const openDirections = () => {
    const dest = patientCoords;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${dest.lat},${dest.lng}`, '_blank');
  };

  return (
    <Card className="glass overflow-hidden border-border/50 relative">
      <div className="p-3 bg-card/90 backdrop-blur border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary animate-spin-slow" />
          <span className="font-semibold text-sm">Live Delivery GPS Map & Route Navigation</span>
        </div>
        <Button size="sm" variant="secondary" onClick={openDirections} className="h-7 text-xs gap-1">
          <Navigation className="h-3.5 w-3.5" /> Google Maps Nav
        </Button>
      </div>

      <CardContent className="p-0 relative">
        <div ref={mapRef} className="h-[280px] w-full bg-muted/30" />

        <div className="p-3 bg-card/80 backdrop-blur border-t border-border/50 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Store className="h-3 w-3 text-purple-500" /> Pickup
            </span>
            <span className="font-bold text-foreground truncate max-w-[100px]">Apollo Meds</span>
          </div>
          <div className="flex flex-col items-center border-x border-border/50">
            <span className="text-muted-foreground flex items-center gap-1">
              <Truck className="h-3 w-3 text-sky-500" /> Distance
            </span>
            <span className="font-bold text-primary">1.8 km (6 mins)</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Home className="h-3 w-3 text-emerald-500" /> Drop-off
            </span>
            <span className="font-bold text-foreground truncate max-w-[100px]">{order?.delivery_address || 'Patient Home'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
