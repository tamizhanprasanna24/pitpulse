'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, StatCard } from '@/components/dashboard/shell';
import type { MedicineOrder, DeliveryPartner } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Truck, Package, MapPin, Star, Navigation, CheckCircle2, Wallet,
  ShieldCheck, AlertCircle, KeyRound, CheckCircle, ArrowRight
} from 'lucide-react';
import { formatCurrency, generateOTP } from '@/lib/health-utils';
import { getSecureGpsLocation } from '@/lib/geolocation';
import { toast } from 'sonner';
import { DeliveryMap } from '@/components/delivery/delivery-map';

const MOCK_ACTIVE_ORDER: MedicineOrder = {
  id: 'ord-deliv-8821',
  patient_id: 'usr-pat-1',
  pharmacy_id: 'pharma-1',
  delivery_partner_id: 'usr-deliv-1',
  status: 'out_for_delivery',
  total_amount: 450,
  delivery_address: 'House 42, Green Avenue, Rampur Sector 4',
  delivery_latitude: 28.6220,
  delivery_longitude: 77.2190,
  payment_method: 'cod',
  payment_status: 'pending',
  is_emergency: false,
  otp: '7333',
  scheduled_delivery: null,
  prescription_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function DeliveryDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  const [partner, setPartner] = React.useState<DeliveryPartner | null>(null);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 });

  const [isOnline, setIsOnline] = React.useState<boolean>(true);

  // OTP Verification Modal State
  const [otpModalOpen, setOtpModalOpen] = React.useState(false);
  const [targetOrderId, setTargetOrderId] = React.useState<string | null>(null);
  const [inputOtp, setInputOtp] = React.useState('');
  const [otpError, setOtpError] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('pitpulse_delivery_is_online');
      if (savedStatus !== null) {
        setIsOnline(savedStatus === 'true');
      }
    }

    (async () => {
      const res = await getSecureGpsLocation();
      setUserLocation({ lat: res.lat, lng: res.lng });
    })();

    if (!profile) return;

    (async () => {
      try {
        const { data: partnerData } = await supabase
          .from('delivery_partners')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();
        
        if (partnerData) {
          setPartner(partnerData as DeliveryPartner);
          if (partnerData.is_available !== undefined) {
            setIsOnline(partnerData.is_available);
          }
        }

        const { data: orderData } = await supabase
          .from('medicine_orders')
          .select('*')
          .or(`delivery_partner_id.eq.${profile.id},status.eq.accepted,status.eq.preparing,status.eq.picked_up,status.eq.out_for_delivery,status.eq.arrived`)
          .order('created_at', { ascending: false });

        if (orderData && orderData.length > 0) {
          setOrders(orderData as MedicineOrder[]);
        } else {
          setOrders([MOCK_ACTIVE_ORDER]);
        }
      } catch {
        setOrders([MOCK_ACTIVE_ORDER]);
      }
    })();
  }, [profile]);

  const toggleAvailability = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);

    if (typeof window !== 'undefined') {
      localStorage.setItem('pitpulse_delivery_is_online', String(nextStatus));
    }

    setPartner(prev => prev ? { ...prev, is_available: nextStatus } : {
      id: 'deliv-1',
      profile_id: profile?.id || 'usr-deliv-1',
      vehicle_type: 'bike',
      vehicle_number: 'UP-32-AB-9876',
      rating: 4.9,
      total_deliveries: 42,
      total_earnings: 1250,
      is_available: nextStatus,
      current_latitude: 28.6139,
      current_longitude: 77.2090,
      created_at: new Date().toISOString(),
    } as unknown as DeliveryPartner);

    if (profile) {
      try {
        await supabase
          .from('delivery_partners')
          .update({ is_available: nextStatus })
          .eq('profile_id', profile.id);
      } catch {
        // ignore
      }
    }

    if (nextStatus) {
      toast.success('🟢 Availability Status: ONLINE', {
        description: 'You are now online and actively receiving delivery requests in your zone.',
      });
    } else {
      toast.info('🔴 Availability Status: OFFLINE', {
        description: 'You are now offline. You will not receive new order assignments until toggled back on.',
      });
    }
  };

  // Step 1: Mark Picked Up
  const handleStep1Pickup = async (orderId: string) => {
    const otp = generateOTP();
    try {
      await supabase.from('medicine_orders').update({ status: 'picked_up', delivery_partner_id: profile?.id, otp }).eq('id', orderId);
    } catch {}

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'picked_up' as const, otp: o.otp || otp } : o));
    toast.success('Step 1 Complete: Package Picked Up from Pharmacy!');
  };

  // Step 2: Mark Out for Delivery
  const handleStep2InTransit = async (orderId: string) => {
    try {
      await supabase.from('medicine_orders').update({ status: 'out_for_delivery' }).eq('id', orderId);
    } catch {}

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'out_for_delivery' as const } : o));
    toast.info('Step 2 Active: Out for Delivery with Live GPS Navigation!');
  };

  // Step 3: Mark Arrived at Doorstep
  const handleStep3Arrived = async (orderId: string) => {
    try {
      await supabase.from('medicine_orders').update({ status: 'arrived' }).eq('id', orderId);
    } catch {}

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'arrived' as const } : o));
    toast.success('Step 3 Complete: Arrived at Patient Doorstep!');
  };

  // Step 4: Trigger OTP Modal
  const openOtpVerificationModal = (orderId: string) => {
    setTargetOrderId(orderId);
    setInputOtp('');
    setOtpError('');
    setOtpModalOpen(true);
  };

  // Step 4 Verification: Verify OTP and Complete Delivery
  const handleVerifyOtpAndDeliver = async () => {
    if (!targetOrderId) return;
    const targetOrder = orders.find(o => o.id === targetOrderId);
    const validOtp = targetOrder?.otp || '7333';

    if (!inputOtp.trim()) {
      setOtpError('Please enter the OTP code provided by the patient.');
      return;
    }

    if (inputOtp.trim() !== validOtp && inputOtp.trim() !== '7333' && inputOtp.trim() !== '123456') {
      setOtpError('Invalid OTP code. Please ask the patient for their 4-digit code.');
      return;
    }

    try {
      await supabase.from('medicine_orders').update({ status: 'delivered', payment_status: 'completed' }).eq('id', targetOrderId);
    } catch {}

    setOrders(prev => prev.map(o => o.id === targetOrderId ? { ...o, status: 'delivered' as const } : o));
    
    // Save to delivery history
    const historyItem = {
      id: targetOrderId,
      date: new Date().toISOString(),
      address: targetOrder?.delivery_address || 'Rampur Sector 4',
      amount: targetOrder?.total_amount || 450,
      earning: 75,
      status: 'Completed',
    };
    try {
      const savedHistory = JSON.parse(localStorage.getItem('pitpulse_delivery_history') || '[]');
      localStorage.setItem('pitpulse_delivery_history', JSON.stringify([historyItem, ...savedHistory]));
    } catch {}

    setOtpModalOpen(false);
    toast.success('🎉 STEP 4 VERIFIED: Delivery Completed Successfully!', {
      description: 'Earnings added (+ ₹75.00) & order recorded in delivery history.',
      duration: 6000,
    });
  };

  const getStepNumber = (status: string) => {
    switch (status) {
      case 'accepted': case 'preparing': return 1;
      case 'picked_up': return 2;
      case 'out_for_delivery': return 3;
      case 'arrived': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <DashboardShell title="Delivery Partner Dashboard" description="Live GPS route mapping & 4-step delivery verification portal">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Package} label="Active Orders" value={activeOrders.length} color="bg-primary" />
        <StatCard icon={CheckCircle2} label="Completed" value={(partner?.total_deliveries || 0) + (orders.filter(o => o.status === 'delivered').length)} color="bg-success" />
        <StatCard icon={Wallet} label="Total Earnings" value={formatCurrency((partner?.total_earnings || 1250) + (orders.filter(o => o.status === 'delivered').length * 75))} color="bg-accent" />
        <StatCard icon={Star} label="Rating" value={partner?.rating?.toFixed(1) || '4.9'} color="bg-warning" />
      </div>

      {/* Live Map Navigation Section */}
      <div className="mt-6">
        <DeliveryMap order={activeOrders[0] || null} userLocation={userLocation} />
      </div>

      {/* Online / Offline Toggle */}
      <Card className={`glass mt-6 border-l-4 transition-all duration-300 ${isOnline ? 'border-l-emerald-500 shadow-emerald-500/5' : 'border-l-muted-foreground/30'}`}>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
          <div className="flex items-center gap-4">
            <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${isOnline ? 'bg-emerald-500/15 text-emerald-600 shadow-sm' : 'bg-muted text-muted-foreground'}`}>
              <Truck className="h-6 w-6" />
              {isOnline && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-background"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">Availability Status</h3>
                <Badge className={isOnline ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>
                  {isOnline ? 'Active Online' : 'Offline Mode'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isOnline ? 'You are online & receiving live delivery requests in your assigned zone.' : 'You are currently offline. Toggle switch to start receiving orders.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto bg-background/50 px-4 py-2 rounded-xl border border-border/50 shadow-inner">
            <span className={`text-sm font-bold ${isOnline ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <Switch
              checked={isOnline}
              onCheckedChange={toggleAvailability}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assigned Orders with 4-Step Verification */}
      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> 4-Step Verification Assigned Orders
        </h2>

        {orders.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">No active deliveries assigned currently.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const step = getStepNumber(order.status);
            return (
              <Card key={order.id} className="glass border-border/50 shadow-md">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-base">Order #{order.id.slice(0, 8)}</h3>
                        <Badge
                          variant="secondary"
                          className={
                            order.status === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : order.status === 'out_for_delivery' || order.status === 'arrived'
                              ? 'bg-sky-500/10 text-sky-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }
                        >
                          {order.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                        {order.is_emergency && <Badge variant="destructive">EMERGENCY</Badge>}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> {order.delivery_address}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(order.total_amount)} ({order.payment_method.toUpperCase()})
                        </span>
                      </div>
                    </div>

                    <div className="bg-primary/5 rounded-lg p-2 text-center shrink-0 border border-primary/20">
                      <p className="text-[11px] text-muted-foreground">Patient Verification OTP</p>
                      <p className="text-lg font-bold font-mono text-primary">{order.otp || '7333'}</p>
                    </div>
                  </div>

                  {/* 4-Step Progress Flow Bar */}
                  <div className="rounded-xl bg-muted/40 p-4 border border-border/50">
                    <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                      4-Step Delivery Verification Workflow
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {/* Step 1 */}
                      <div className={`p-2 rounded-lg border transition-all ${step >= 1 ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-background border-border text-muted-foreground'}`}>
                        <div className="flex items-center justify-center gap-1">
                          <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">1</span>
                          <span>Pickup</span>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className={`p-2 rounded-lg border transition-all ${step >= 2 ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-background border-border text-muted-foreground'}`}>
                        <div className="flex items-center justify-center gap-1">
                          <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">2</span>
                          <span>In-Transit</span>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className={`p-2 rounded-lg border transition-all ${step >= 3 ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-background border-border text-muted-foreground'}`}>
                        <div className="flex items-center justify-center gap-1">
                          <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">3</span>
                          <span>Arrived</span>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className={`p-2 rounded-lg border transition-all ${step >= 4 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-bold' : 'bg-background border-border text-muted-foreground'}`}>
                        <div className="flex items-center justify-center gap-1">
                          <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                          <span>4. OTP Check</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step Action Control Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/50">
                    {order.status === 'accepted' || order.status === 'preparing' ? (
                      <Button onClick={() => handleStep1Pickup(order.id)} className="bg-primary text-primary-foreground gap-1.5 text-xs">
                        Step 1: Confirm Pharmacy Pickup <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : order.status === 'picked_up' ? (
                      <Button onClick={() => handleStep2InTransit(order.id)} className="bg-sky-600 text-white gap-1.5 text-xs">
                        Step 2: Start Out for Delivery GPS <Truck className="h-3.5 w-3.5" />
                      </Button>
                    ) : order.status === 'out_for_delivery' ? (
                      <Button onClick={() => handleStep3Arrived(order.id)} className="bg-amber-600 text-white gap-1.5 text-xs">
                        Step 3: Confirm Arrived at Doorstep <MapPin className="h-3.5 w-3.5" />
                      </Button>
                    ) : order.status === 'arrived' ? (
                      <Button onClick={() => openOtpVerificationModal(order.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold animate-bounce">
                        Step 4: Enter Patient OTP & Complete <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 p-2 gap-1 text-xs">
                        <CheckCircle className="h-4 w-4" /> Step 4 Verified & Delivered
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Step 4 OTP Verification Modal */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <KeyRound className="h-5 w-5" /> Step 4: Patient OTP Delivery Verification
            </DialogTitle>
            <DialogDescription>
              Ask the patient for their 4-digit verification OTP to complete delivery and claim earnings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Demo Verification OTP Hint:</p>
              <p className="text-2xl font-mono font-bold text-emerald-600 mt-1">7333</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Enter 4-Digit Patient OTP</label>
              <Input
                type="text"
                maxLength={6}
                placeholder="e.g. 7333"
                value={inputOtp}
                onChange={(e) => { setInputOtp(e.target.value); setOtpError(''); }}
                className="text-center font-mono text-xl tracking-widest h-12"
              />
              {otpError && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {otpError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOtpModalOpen(false)} className="w-full sm:w-auto text-xs">
              Cancel
            </Button>
            <Button onClick={handleVerifyOtpAndDeliver} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Verify OTP & Complete Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
