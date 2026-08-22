'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldCheck, Search, RefreshCw, Lock } from 'lucide-react';
import type { AuditLog } from '@/types';

export default function DiagnosticAuditLogsPage() {
  const { profile } = useAuth();
  const centreID = profile?.centre_id || profile?.license_number || 'APOLLO-7F2K91QM';
  const staffRole = profile?.staff_role || 'centre_admin';

  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/audit-logs?centre_id=${centreID}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [centreID]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.staff_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (staffRole !== 'centre_admin') {
    return (
      <DashboardShell title="Security Audit Logs" description="Restricted Access">
        <div className="py-12 text-center space-y-3">
          <Lock className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Security audit logs are restricted to Centre Admins for compliance and security auditing.
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Security Audit Logs" description={`Centre ID: ${centreID} • Compliance & Staff Action Audit Trail`}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/50 backdrop-blur-md">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search action, staff, details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-1 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
          </Button>
        </div>

        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold">Audit Event History ({filteredLogs.length})</CardTitle>
            <CardDescription className="text-xs">Immutable record of logins, report uploads, test creations, and staff actions</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No audit events recorded for this search query.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((l) => (
                  <div key={l.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-card/40 border border-border/40 hover:bg-card/70 transition-all text-xs gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                          {l.action}
                        </Badge>
                        <span className="font-semibold text-foreground">{l.staff_name}</span>
                        <span className="font-mono text-muted-foreground text-[10px]">({l.staff_id})</span>
                      </div>
                      <p className="text-muted-foreground mt-1">{l.details || 'No additional details'}</p>
                    </div>

                    <div className="text-start sm:text-end shrink-0">
                      <span className="font-mono text-[11px] text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
