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
    <div className="space-y-5">
      
      {/* Title & Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Conflict Audit
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Validation of room collisions, teacher overlap, and capacity constraints.
          </p>
        </div>

        {/* Timetable Selector */}
        <div className="flex items-center gap-2">
          <select
            value={activeTimetableId}
            onChange={(e) => handleTimetableChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 py-0 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {timetables.map(tt => (
              <option key={tt.id} value={tt.id}>{tt.name} ({tt.status})</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => loadAudit(activeTimetableId)}
            title="Re-run Audit"
            className="h-8 w-8 shadow-none"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Audit Status Card */}
      {conflicts.length === 0 ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Audit Clean • Zero Conflicts
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                All faculty, class sections, room capacities, and lab sessions are strictly satisfied.
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              setSelectedTimetableId(activeTimetableId);
              setActiveTab('timetables');
            }}
            className="gap-1.5 h-8 text-xs font-medium shrink-0 shadow-none"
            size="sm"
          >
            <span>View Grid</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">
              {conflicts.length} Constraint Conflict{conflicts.length !== 1 ? 's' : ''} Detected
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Resolve overlapping assignments before publishing this timetable to students and faculty.
          </p>

          <div className="space-y-2.5 pt-1">
            {conflicts.map((c, idx) => (
              <div key={idx} className="rounded-lg border border-border/80 bg-card p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                    {c.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {c.severity}
                  </span>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {c.description}
                </p>
                {c.suggestedResolution && (
                  <div className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2">
                    <span className="font-semibold text-foreground">Fix: </span>
                    <span>{c.suggestedResolution}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
