import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api/client';
import { 
  Building2, 
  Users, 
  BookOpen, 
  DoorOpen, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  CalendarDays,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export default function Dashboard() {
  const { setActiveTab, setSelectedTimetableId } = useAppStore();
  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [dashRes, deptRes] = await Promise.all([
          api.getDashboardStats(),
          api.getDepartments(),
        ]);
        setData(dashRes);
        setDepartments(deptRes.departments || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading college analytics...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentTimetables = data?.recentTimetables || [];
  const recentAuditLogs = data?.recentAuditLogs || [];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Solver Ready
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated conflict-free scheduling and academic resource status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('timetables')}
            className="h-8 text-xs font-medium gap-1.5 shadow-none"
          >
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span>View Matrix</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab('generator')}
            className="h-8 text-xs font-medium gap-1.5 shadow-none"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate Schedule</span>
          </Button>
        </div>
      </div>

      {/* Clean Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-lg border border-border/80 bg-card p-4 hover:border-border transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Departments</span>
            <Building2 className="h-4 w-4 stroke-[1.75]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {stats.departmentsCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            CSE, IT, AI&DS, MECH
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-4 hover:border-border transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Student Divisions</span>
            <Users className="h-4 w-4 stroke-[1.75]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {stats.divisionsCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Active class sections
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-4 hover:border-border transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Faculty Members</span>
            <BookOpen className="h-4 w-4 stroke-[1.75]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {stats.facultyCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            With subject qualifications
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-4 hover:border-border transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Rooms & Labs</span>
            <DoorOpen className="h-4 w-4 stroke-[1.75]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {stats.roomsCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Classrooms & practical labs
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Timetables & Engine Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recent Timetables Table */}
        <Card className="lg:col-span-2 shadow-none border-border/80">
          <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Generated Schedules</CardTitle>
              <CardDescription className="text-xs mt-0.5">Recently compiled college timetables</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('timetables')}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <span>All Schedules</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentTimetables.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No schedules compiled yet. Click "Generate Schedule" to create one.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentTimetables.map((tt) => (
                  <div key={tt.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-xs text-foreground truncate">{tt.name}</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] h-4.5 px-1.5 font-normal border-0 ${
                            tt.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : tt.status === 'ARCHIVED'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {tt.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {tt.academicYear?.name || '2026-27'} • {tt._count?.entries || 0} scheduled sessions
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTimetableId(tt.id);
                        setActiveTab('timetables');
                      }}
                      className="h-8 px-2.5 text-xs text-primary hover:bg-primary/10 shrink-0"
                    >
                      Open Grid
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engine Heuristics & Conflict Summary */}
        <Card className="shadow-none border-border/80">
          <CardHeader className="p-4 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Scheduler Guardrails</CardTitle>
            </div>
            <CardDescription className="text-xs">Continuous constraint enforcement</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-foreground">Faculty Overlap Guard</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Zero Clash</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-foreground">Lab & Room Capacities</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Matched</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-foreground">Consecutive Practical Blocks</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Contiguous</span>
            </div>

            <div className="flex items-center justify-between py-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-foreground">Cross-Dept Shared Faculty</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Synced</span>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('conflicts')}
                className="w-full h-8 text-xs font-normal text-muted-foreground hover:text-foreground"
              >
                Run Conflict Audit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Audit Activity */}
      {recentAuditLogs.length > 0 && (
        <Card className="shadow-none border-border/80">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {recentAuditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-4">
                    <span className="font-mono text-[10px] uppercase text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                      {log.action}
                    </span>
                    <span className="text-foreground truncate">
                      {log.details ? (typeof log.details === 'object' ? (log.details.name || JSON.stringify(log.details)) : log.details) : 'Action executed'}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
