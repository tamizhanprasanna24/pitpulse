'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Search, RefreshCw, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import type { DiagnosticTest } from '@/types';

export default function DiagnosticTestsPage() {
  const { profile } = useAuth();
  const centreID = profile?.centre_id || profile?.license_number || 'APOLLO-7F2K91QM';
  const staffRole = profile?.staff_role || 'centre_admin';

  const [tests, setTests] = React.useState<DiagnosticTest[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Form Fields
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('Pathology');
  const [price, setPrice] = React.useState('');
  const [prepInstructions, setPrepInstructions] = React.useState('No special preparation required.');
  const [estHours, setEstHours] = React.useState('12');
  const [homeCollection, setHomeCollection] = React.useState(true);

  const fetchTests = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/tests?centre_id=${centreID}`);
      const data = await res.json();
      if (data.success) {
        setTests(data.tests || []);
      }
    } catch {
      toast.error('Failed to load test catalogue.');
    } finally {
      setLoading(false);
    }
  }, [centreID]);

  React.useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      toast.error('Test Name and Price are required.');
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch('/api/diagnostic/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centre_id: centreID,
          staff_id: profile?.staff_id || 'ADMIN-1',
          staff_name: profile?.full_name || 'Centre Admin',
          name: name.trim(),
          category: category.trim(),
          price: Number(price),
          prep_instructions: prepInstructions.trim(),
          est_completion_hours: Number(estHours) || 12,
          home_collection_available: homeCollection,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to add test.');
        setSubmitting(false);
        return;
      }

      toast.success('New diagnostic test added to catalogue!');
      setShowAddModal(false);
      setName('');
      setPrice('');
      fetchTests();
    } catch {
      toast.error('Network error adding test.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (testID: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/diagnostic/tests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centre_id: centreID,
          staff_id: profile?.staff_id || 'ADMIN-1',
          staff_name: profile?.full_name || 'Centre Admin',
          test_id: testID,
          is_active: !currentActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Test ${!currentActive ? 'enabled' : 'disabled'} successfully.`);
        fetchTests();
      }
    } catch {
      toast.error('Failed to update test status.');
    }
  };

  const filteredTests = tests.filter(
    (t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardShell title="Diagnostic Test Catalogue" description={`Centre ID: ${centreID} • Manage tests, pricing, and preparation guidelines`}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/50 backdrop-blur-md">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={fetchTests} variant="outline" size="sm" className="gap-1 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>

            {staffRole === 'centre_admin' && (
              <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1 text-xs bg-gradient-to-r from-primary to-accent text-white">
                <Plus className="h-3.5 w-3.5" /> Add New Test
              </Button>
            )}
          </div>
        </div>

        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold">Diagnostic Tests Catalogue ({filteredTests.length})</CardTitle>
            <CardDescription className="text-xs">Customizable tests available for patient and doctor bookings</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {filteredTests.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No tests found in your catalogue.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTests.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl bg-card/40 border border-border/40 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm leading-tight">{t.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {t.category}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">📋 {t.prep_instructions}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">⏱️ Completion Time: {t.est_completion_hours} hours</p>
                    </div>

                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-primary">₹{t.price}</span>
                        {t.home_collection_available && (
                          <span className="text-[10px] text-emerald-500 font-semibold block">✓ Home Pickup</span>
                        )}
                      </div>

                      {staffRole === 'centre_admin' && (
                        <Button
                          size="sm"
                          variant={t.is_active ? 'outline' : 'secondary'}
                          onClick={() => handleToggleActive(t.id, t.is_active)}
                          className="text-[11px] h-7"
                        >
                          {t.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Test Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Diagnostic Test</DialogTitle>
            <DialogDescription className="text-xs">Add a custom test to your centre&apos;s catalogue</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTest} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Test Name *</Label>
              <Input placeholder="e.g. Thyroid Profile (T3, T4, TSH)" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="e.g. Biochemistry" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input type="number" placeholder="500" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preparation Instructions</Label>
              <Input placeholder="e.g. 10-hour overnight fasting required." value={prepInstructions} onChange={(e) => setPrepInstructions(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Est. Completion (Hours)</Label>
                <Input type="number" value={estHours} onChange={(e) => setEstHours(e.target.value)} />
              </div>

              <div className="flex items-center justify-between pt-6">
                <Label className="text-xs">Home Collection?</Label>
                <Switch checked={homeCollection} onCheckedChange={setHomeCollection} />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-white">
                {submitting ? 'Adding...' : 'Save Test'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
