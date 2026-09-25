import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api/client';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  DoorOpen, 
  Layers, 
  Archive, 
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export default function TimetablesView() {
  const { selectedTimetableId, setSelectedTimetableId, currentUser } = useAppStore();
  
  const [timetables, setTimetables] = useState([]);
  const [currentTimetable, setCurrentTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter View Modes: 'DIVISION' | 'FACULTY' | 'ROOM'
  const [viewMode, setViewMode] = useState('DIVISION');
  const [selectedEntityId, setSelectedEntityId] = useState('');

  // Manual Move Modal State
  const [movingEntry, setMovingEntry] = useState(null);
  const [targetSlotId, setTargetSlotId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [targetFacultyId, setTargetFacultyId] = useState('');
  const [moveError, setMoveError] = useState(null);
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveSuccess, setMoveSuccess] = useState(null);

  // Master lists for filters and modal
  const [divisions, setDivisions] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  // Fetch all timetables and master data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [ttRes, divRes, facRes, rmRes, tsRes] = await Promise.all([
          api.getTimetables(),
          api.getDivisions(),
          api.getFaculty(),
          api.getRooms(),
          api.getTimeSlots(),
        ]);

        setTimetables(ttRes.timetables || []);
        setDivisions(divRes.divisions || []);
        setFacultyList(facRes.faculty || []);
        setRoomsList(rmRes.rooms || []);
        setTimeSlots(tsRes.timeSlots || []);

        const initialTtId = selectedTimetableId || ttRes.timetables[0]?.id;
        if (initialTtId) {
          setSelectedTimetableId(initialTtId);
          loadTimetableDetails(initialTtId);
        }
      } catch (err) {
        console.error('Failed to load timetables view data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadTimetableDetails = async (id) => {
    try {
      const res = await api.getTimetable(id);
      setCurrentTimetable(res.timetable);
      if (divisions.length > 0 && !selectedEntityId) {
        setSelectedEntityId(divisions[0].id);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    }
  };

  useEffect(() => {
    if (viewMode === 'DIVISION' && divisions.length > 0) {
      setSelectedEntityId(divisions[0].id);
    } else if (viewMode === 'FACULTY' && facultyList.length > 0) {
      setSelectedEntityId(facultyList[0].id);
    } else if (viewMode === 'ROOM' && roomsList.length > 0) {
      setSelectedEntityId(roomsList[0].id);
    }
  }, [viewMode, divisions, facultyList, roomsList]);

  const handlePublish = async () => {
    if (!currentTimetable) return;
    try {
      await api.publishTimetable(currentTimetable.id);
      setCurrentTimetable(prev => ({ ...prev, status: 'PUBLISHED' }));
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      alert(err.message || 'Cannot publish timetable with unresolved conflicts.');
    }
  };

  const handleArchive = async () => {
    if (!currentTimetable) return;
    try {
      await api.archiveTimetable(currentTimetable.id);
      setCurrentTimetable(prev => ({ ...prev, status: 'ARCHIVED' }));
    } catch (err) {
      alert(err.message || 'Failed to archive timetable.');
    }
  };

  const openMoveModal = (entry) => {
    setMovingEntry(entry);
    setTargetSlotId(entry.timeSlotId);
    setTargetRoomId(entry.roomId);
    setTargetFacultyId(entry.facultyId);
    setMoveError(null);
    setMoveSuccess(null);
  };

  const handleExecuteMove = async (e) => {
    e.preventDefault();
    setMoveError(null);
    setMoveSuccess(null);
    setMoveLoading(true);

    try {
      const res = await api.moveEntry(currentTimetable.id, {
        entryId: movingEntry.id,
        newTimeSlotId: targetSlotId,
        newRoomId: targetRoomId,
        newFacultyId: targetFacultyId,
      });

      setMoveSuccess(res.message || 'Entry moved successfully!');
      await loadTimetableDetails(currentTimetable.id);
      setTimeout(() => {
        setMovingEntry(null);
        setMoveSuccess(null);
      }, 1000);
    } catch (err) {
      setMoveError(err.message || 'Move violates scheduling constraints.');
    } finally {
      setMoveLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!currentTimetable) return;
    const headers = ['Day', 'Period', 'Time', 'Division', 'Subject Code', 'Subject Name', 'Faculty', 'Room', 'Room Type'];
    const rows = (currentTimetable.entries || []).map(e => [
      e.timeSlot.day,
      `P${e.timeSlot.periodNumber}`,
      `${e.timeSlot.startTime}-${e.timeSlot.endTime}`,
      e.division.name,
      e.subject.code,
      `"${e.subject.name}"`,
      `"${e.faculty.name}"`,
      `"${e.room.roomNumber}"`,
      e.room.roomType,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentTimetable.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading timetable matrix...</span>
        </div>
      </div>
    );
  }

  const filteredEntries = (currentTimetable?.entries || []).filter(entry => {
    if (!selectedEntityId) return true;
    if (viewMode === 'DIVISION') return entry.divisionId === selectedEntityId;
    if (viewMode === 'FACULTY') return entry.facultyId === selectedEntityId;
    if (viewMode === 'ROOM') return entry.roomId === selectedEntityId;
    return true;
  });

  const periods = [1, 2, 3, 4, 5, 6];
  const periodTimes = {
    1: '09:00 - 10:00',
    2: '10:00 - 11:00',
    3: '11:15 - 12:15',
    4: '12:15 - 13:15',
    5: '14:00 - 15:00',
    6: '15:00 - 16:00',
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {currentTimetable?.name || 'Academic Timetable Matrix'}
            </h1>
            {currentTimetable && (
              <Badge
                variant={
                  currentTimetable.status === 'PUBLISHED'
                    ? 'success'
                    : currentTimetable.status === 'ARCHIVED'
                    ? 'secondary'
                    : 'info'
                }
                className="font-medium"
              >
                {currentTimetable.status}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Academic Year {currentTimetable?.academicYear?.name || '2026-27'} • {filteredEntries.length} sessions scheduled
          </p>
        </div>

        {/* Action Buttons: Publish, Export, Archive, Print */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'DEPARTMENT_ADMIN') && currentTimetable?.status !== 'PUBLISHED' && (
            <Button
              onClick={handlePublish}
              size="sm"
              className="gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Publish Timetable</span>
            </Button>
          )}

          {currentUser && currentUser.role === 'SUPER_ADMIN' && currentTimetable?.status === 'PUBLISHED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              className="gap-1.5"
            >
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Archive</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Filter and View Mode Switcher Card */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
            <TabsList className="grid grid-cols-3 w-full sm:w-[380px]">
              <TabsTrigger value="DIVISION" className="gap-1.5 text-xs">
                <Layers className="h-3.5 w-3.5" />
                <span>Division</span>
              </TabsTrigger>
              <TabsTrigger value="FACULTY" className="gap-1.5 text-xs">
                <User className="h-3.5 w-3.5" />
                <span>Faculty</span>
              </TabsTrigger>
              <TabsTrigger value="ROOM" className="gap-1.5 text-xs">
                <DoorOpen className="h-3.5 w-3.5" />
                <span>Room</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Entity Selector (Divisions, Faculty, Rooms) & Timetable Select */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Select {viewMode.toLowerCase()}:</span>
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {viewMode === 'DIVISION' && divisions.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.department?.code || 'Dept'} - {d.studentCount} students)</option>
                ))}

                {viewMode === 'FACULTY' && facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.department?.code})</option>
                ))}

                {viewMode === 'ROOM' && roomsList.map(r => (
                  <option key={r.id} value={r.id}>{r.roomNumber} ({r.roomType} - Cap {r.capacity})</option>
                ))}
              </select>
            </div>

            {timetables.length > 1 && (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <span className="text-xs font-medium text-muted-foreground">Schedule:</span>
                <select
                  value={currentTimetable?.id || ''}
                  onChange={(e) => {
                    setSelectedTimetableId(e.target.value);
                    loadTimetableDetails(e.target.value);
                  }}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {timetables.map(tt => (
                    <option key={tt.id} value={tt.id}>{tt.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Interactive Timetable Weekly Grid Card */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="p-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Period</th>
                {DAYS.map(day => (
                  <th key={day} className="p-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {periods.map(periodNum => {
                const isAfterLunch = periodNum === 5;

                return (
                  <React.Fragment key={periodNum}>
                    {isAfterLunch && (
                      <tr className="bg-muted/30 border-y border-border">
                        <td colSpan={6} className="py-2.5 px-4 text-center text-xs font-medium text-muted-foreground tracking-wider uppercase">
                          ☕ Lunch & Recess Break (13:15 - 14:00)
                        </td>
                      </tr>
                    )}

                    <tr className="hover:bg-muted/20 transition-colors">
                      {/* Period Time Header */}
                      <td className="p-3 bg-muted/10 border-r border-border align-top">
                        <span className="font-bold text-sm text-foreground">P{periodNum}</span>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{periodTimes[periodNum]}</div>
                      </td>

                      {/* Day Cells */}
                      {DAYS.map(day => {
                        const entry = filteredEntries.find(
                          e => e.timeSlot.day === day && e.timeSlot.periodNumber === periodNum
                        );

                        if (!entry) {
                          return (
                            <td key={day} className="p-2 border-r border-border/60 align-top">
                              <div className="h-20 rounded-lg border border-dashed border-border/80 flex items-center justify-center text-[11px] text-muted-foreground/60 select-none">
                                Available
                              </div>
                            </td>
                          );
                        }

                        const isLab = entry.subject.type === 'LAB';
                        const canEdit = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'DEPARTMENT_ADMIN');

                        return (
                          <td key={day} className="p-2 border-r border-border/60 align-top">
                            <div
                              onClick={() => canEdit && openMoveModal(entry)}
                              className={`group h-20 rounded-lg p-2.5 border transition-all flex flex-col justify-between ${
                                canEdit ? 'cursor-pointer hover:border-primary hover:shadow-sm' : ''
                              } ${
                                isLab
                                  ? 'bg-secondary/70 border-border'
                                  : 'bg-card border-border'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="truncate font-semibold text-xs text-foreground">
                                  {entry.subject.code}
                                </span>
                                <Badge 
                                  variant={isLab ? 'purple' : 'secondary'}
                                  className="text-[9px] px-1 py-0 h-4 font-normal"
                                >
                                  {entry.subject.type}
                                </Badge>
                              </div>

                              <div className="truncate text-[11px] text-muted-foreground font-medium" title={entry.subject.name}>
                                {entry.subject.name}
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/60">
                                <span className="truncate max-w-[90px]" title={entry.faculty.name}>
                                  {entry.faculty.name.replace('Prof. ', '')}
                                </span>
                                <span className="font-medium text-foreground">
                                  {entry.room.roomNumber}
                                </span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Slot Mover / Reassign Modal using Shadcn Dialog */}
      <Dialog open={!!movingEntry} onOpenChange={(open) => !open && setMovingEntry(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Move & Reschedule Session</DialogTitle>
            <DialogDescription>
              Backend constraint engine will pre-validate all faculty, room and division overlaps before committing.
            </DialogDescription>
          </DialogHeader>

          {movingEntry && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">
                  {movingEntry.subject.name} ({movingEntry.subject.code})
                </span>
                <Badge variant="outline" className="text-xs">
                  {movingEntry.division.name}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: {movingEntry.timeSlot.day} P{movingEntry.timeSlot.periodNumber} • Room {movingEntry.room.roomNumber} • {movingEntry.faculty.name}
              </p>
            </div>
          )}

          <form onSubmit={handleExecuteMove} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="targetSlot">Target Time Slot</Label>
              <select
                id="targetSlot"
                value={targetSlotId}
                onChange={(e) => setTargetSlotId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                {timeSlots.map(ts => (
                  <option key={ts.id} value={ts.id}>
                    {ts.day} Period P{ts.periodNumber} ({ts.startTime} - {ts.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetRoom">Target Room / Laboratory</Label>
              <select
                id="targetRoom"
                value={targetRoomId}
                onChange={(e) => setTargetRoomId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                {roomsList.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.roomType} • Capacity: {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetFaculty">Assign Qualified Faculty</Label>
              <select
                id="targetFaculty"
                value={targetFacultyId}
                onChange={(e) => setTargetFacultyId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.department?.code})
                  </option>
                ))}
              </select>
            </div>

            {moveError && (
              <Alert variant="destructive">
                <AlertTitle>Constraint Violation</AlertTitle>
                <AlertDescription>{moveError}</AlertDescription>
              </Alert>
            )}

            {moveSuccess && (
              <Alert variant="success">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{moveSuccess}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setMovingEntry(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={moveLoading} className="gap-2">
                {moveLoading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
                <span>Validate & Move</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
