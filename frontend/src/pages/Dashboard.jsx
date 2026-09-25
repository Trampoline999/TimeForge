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
      
      {/* Hero Welcome Card */}
      <Card className="border-border bg-gradient-to-r from-card to-secondary/30 shadow-sm overflow-hidden">
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5">
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                <Sparkles className="h-3 w-3" />
                Constraint Satisfaction Engine Active
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Engineering College Timetable Hub
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automated conflict-free scheduling respecting faculty qualifications, shared laboratories, consecutive practical blocks, and room capacities across all college branches.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => setActiveTab('generator')}
              className="gap-2 shadow-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              <span>Launch Generator</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('timetables')}
              className="gap-2"
            >
              <span>View Grid</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* College Resource Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Departments
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.departmentsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">CSE, IT, AI&DS, MECH</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Divisions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.divisionsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Semester 1 through 8</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Faculty Members
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.facultyCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Professors & Instructors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Rooms & Labs
            </CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.roomsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Lecture Halls & Shared Labs</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Timetables & Engine Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Timetables Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Active & Generated Schedules</CardTitle>
              <CardDescription>Recently generated multi-department timetables</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('timetables')}
              className="gap-1 text-xs"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentTimetables.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No timetables generated yet. Click "Launch Generator" to create your first schedule.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule Name</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTimetables.map((tt) => (
                    <TableRow key={tt.id}>
                      <TableCell className="font-medium text-foreground">
                        {tt.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {tt.academicYear?.name || '2026-27'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tt.status === 'PUBLISHED'
                              ? 'success'
                              : tt.status === 'ARCHIVED'
                              ? 'secondary'
                              : 'info'
                          }
                          className="font-medium"
                        >
                          {tt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {tt._count?.entries || 0} slots
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTimetableId(tt.id);
                            setActiveTab('timetables');
                          }}
                          className="h-8 px-2 text-xs"
                        >
                          Open Matrix
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Engine Status & Quick Metrics Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Constraint Validation</CardTitle>
            </div>
            <CardDescription>Engine heuristics and live safety rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Faculty Collision Guard</p>
                <p className="text-[11px] text-muted-foreground">
                  Zero faculty overlapping across simultaneous periods.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Room Capacity & Type Matching</p>
                <p className="text-[11px] text-muted-foreground">
                  Practicals strictly routed to Computer / Hardware Labs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Consecutive Lab Blocks</p>
                <p className="text-[11px] text-muted-foreground">
                  2-hour contiguous blocks preserved around lunch breaks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Shared Mathematics Faculty</p>
                <p className="text-[11px] text-muted-foreground">
                  Synchronized across CSE, IT & MECH departments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Audit Logs */}
      {recentAuditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent System Activity</CardTitle>
            <CardDescription>Audit trail of generation runs, publishes, and overrides</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAuditLogs.slice(0, 5).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono font-normal">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                      {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) : '-'}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {log.user?.name || 'System Engine'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground text-right">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
