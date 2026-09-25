import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api/client';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  RefreshCw, 
  UserX, 
  DoorClosed, 
  Layers, 
  CalendarX 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ConflictDashboard() {
  const { selectedTimetableId, setSelectedTimetableId, setActiveTab } = useAppStore();
  const [timetables, setTimetables] = useState([]);
  const [activeTimetableId, setActiveTimetableId] = useState(selectedTimetableId || '');
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimetables() {
      try {
        setLoading(true);
        const res = await api.getTimetables();
        setTimetables(res.timetables || []);
        if (res.timetables?.length > 0 && !activeTimetableId) {
          const id = selectedTimetableId || res.timetables[0].id;
          setActiveTimetableId(id);
          loadAudit(id);
        }
      } catch (err) {
        console.error('Failed to load timetables for conflict review:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTimetables();
  }, []);

  const loadAudit = async (timetableId) => {
    try {
      setLoading(true);
      const res = await api.getConflicts(timetableId);
      setConflicts(res.conflicts || []);
    } catch (err) {
      console.error('Failed to audit conflicts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimetableChange = (id) => {
    setActiveTimetableId(id);
    setSelectedTimetableId(id);
    loadAudit(id);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Constraint & Conflict Dashboard
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time audit engine detecting room collisions, faculty double-booking, and capacity limits.
          </p>
        </div>

        {/* Timetable Selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-muted-foreground">Schedule:</span>
          <select
            value={activeTimetableId}
            onChange={(e) => handleTimetableChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {timetables.map(tt => (
              <option key={tt.id} value={tt.id}>{tt.name} ({tt.status})</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => loadAudit(activeTimetableId)}
            title="Re-run Constraint Audit"
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Audit Status Card */}
      {conflicts.length === 0 ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Clean Audit: Zero Constraint Violations
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All faculty, division, room capacity, and 2-period practical block requirements are strictly satisfied.
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setSelectedTimetableId(activeTimetableId);
                setActiveTab('timetables');
              }}
              className="gap-2 shrink-0"
              size="sm"
            >
              <span>View in Grid</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <CardTitle className="text-base font-semibold text-foreground">
                {conflicts.length} Hard Constraint Violations Detected
              </CardTitle>
            </div>
            <CardDescription>
              This timetable cannot be published until all hard conflicts are resolved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflicts.map((c, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive" className="text-[10px]">
                    {c.type}
                  </Badge>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Severity: {c.severity}
                  </span>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {c.description}
                </p>
                {c.suggestedResolution && (
                  <div className="text-xs text-muted-foreground bg-muted/60 rounded p-2.5">
                    <span className="font-semibold text-foreground">Recommended Fix: </span>
                    <span>{c.suggestedResolution}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Constraints Glossary & Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Enforced Hard Constraints Reference
          </CardTitle>
          <CardDescription>
            Core algorithmic invariants maintained across all department timetables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <span className="font-semibold text-primary">FACULTY_CONFLICT</span>
              <p className="text-muted-foreground text-[11px]">
                Prevents a faculty member from being scheduled in multiple classrooms simultaneously.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <span className="font-semibold text-primary">ROOM_CONFLICT</span>
              <p className="text-muted-foreground text-[11px]">
                Enforces single-occupancy per room across all engineering departments.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <span className="font-semibold text-primary">ROOM_TYPE_CONSTRAINT</span>
              <p className="text-muted-foreground text-[11px]">
                Ensures computer and hardware practicals strictly use compatible laboratories.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <span className="font-semibold text-primary">ROOM_CAPACITY_CONSTRAINT</span>
              <p className="text-muted-foreground text-[11px]">
                Validates room seating capacity is greater than or equal to division student count.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <span className="font-semibold text-primary">CONSECUTIVE_PERIOD</span>
              <p className="text-muted-foreground text-[11px]">
                Guarantees 2-period lab blocks are scheduled in continuous unbroken slots on the same day.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <span className="font-semibold text-primary">AVAILABILITY_RESPECT</span>
              <p className="text-muted-foreground text-[11px]">
                Zero assignments allowed during slots marked unavailable in the availability grid.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
