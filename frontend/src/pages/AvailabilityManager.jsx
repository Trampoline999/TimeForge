import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Clock, CheckCircle2, XCircle, Info, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export default function AvailabilityManager() {
  const [targetType, setTargetType] = useState('FACULTY');
  const [facultyList, setFacultyList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  
  // Availability map: slotId -> boolean (true: available, false: unavailable)
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [facRes, divRes, tsRes] = await Promise.all([
          api.getFaculty(),
          api.getDivisions(),
          api.getTimeSlots(),
        ]);

        setFacultyList(facRes.faculty || []);
        setDivisionsList(divRes.divisions || []);
        setTimeSlots(tsRes.timeSlots || []);

        if (facRes.faculty?.length > 0) {
          setSelectedId(facRes.faculty[0].id);
          loadFacultyAvailability(facRes.faculty[0].id);
        }
      } catch (err) {
        console.error('Failed to load availability data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadFacultyAvailability = async (facultyId) => {
    try {
      const res = await api.getFacultyAvailability(facultyId);
      const map = {};
      (res.availability || []).forEach(a => {
        map[a.timeSlotId] = a.isAvailable;
      });
      setAvailabilityMap(map);
    } catch (err) {
      console.error('Failed to load faculty availability:', err);
    }
  };

  const handleTypeChange = (type) => {
    setTargetType(type);
    if (type === 'FACULTY') {
      if (facultyList.length > 0) {
        setSelectedId(facultyList[0].id);
        loadFacultyAvailability(facultyList[0].id);
      }
    } else {
      if (divisionsList.length > 0) {
        setSelectedId(divisionsList[0].id);
        setAvailabilityMap({});
      }
    }
  };

  const handleEntityChange = (id) => {
    setSelectedId(id);
    if (targetType === 'FACULTY') {
      loadFacultyAvailability(id);
    } else {
      setAvailabilityMap({});
    }
  };

  const toggleSlotAvailability = async (slotId) => {
    const currentVal = availabilityMap[slotId] !== false;
    const newVal = !currentVal;

    // Optimistic local update
    setAvailabilityMap(prev => ({ ...prev, [slotId]: newVal }));

    try {
      if (targetType === 'FACULTY') {
        await api.setFacultyAvailability({
          facultyId: selectedId,
          timeSlotId: slotId,
          isAvailable: newVal,
        });
      } else {
        await api.setDivisionAvailability({
          divisionId: selectedId,
          timeSlotId: slotId,
          isAvailable: newVal,
        });
      }
    } catch (err) {
      console.error('Failed to persist availability:', err);
      // Revert on error
      setAvailabilityMap(prev => ({ ...prev, [slotId]: currentVal }));
    }
  };

  const periods = [1, 2, 3, 4, 5, 6];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading availability matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Period Availability Matrix
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Specify blacklisted or restricted periods for faculty and divisions. The engine strictly avoids scheduling in these slots.
          </p>
        </div>

        {/* Entity Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Tabs value={targetType} onValueChange={handleTypeChange} className="w-auto">
            <TabsList className="grid grid-cols-2 w-[180px]">
              <TabsTrigger value="FACULTY" className="text-xs">Faculty</TabsTrigger>
              <TabsTrigger value="DIVISION" className="text-xs">Division</TabsTrigger>
            </TabsList>
          </Tabs>

          <select
            value={selectedId}
            onChange={(e) => handleEntityChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {targetType === 'FACULTY'
              ? facultyList.map(f => <option key={f.id} value={f.id}>{f.name} ({f.department?.code})</option>)
              : divisionsList.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department?.code})</option>)}
          </select>
        </div>
      </div>

      {/* Guide Note Alert */}
      <Alert className="border-border bg-card">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs flex items-center justify-between flex-wrap gap-2">
          <span>Click any grid slot to toggle between <strong>Available (Active)</strong> and <strong>Restricted (Blocked)</strong>.</span>
          <Badge variant="outline" className="text-[10px] font-normal">
            Auto-saves immediately to backend
          </Badge>
        </AlertDescription>
      </Alert>

      {/* Availability Grid Card */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="p-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Period</th>
                {DAYS.map(day => (
                  <th key={day} className="p-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {periods.map(periodNum => (
                <tr key={periodNum} className="hover:bg-muted/10 transition-colors">
                  <td className="p-3 bg-muted/10 border-r border-border font-bold text-sm text-foreground">
                    P{periodNum}
                  </td>

                  {DAYS.map(day => {
                    const slot = timeSlots.find(s => s.day === day && s.periodNumber === periodNum);
                    if (!slot) return <td key={day} className="p-2 border-r border-border/60" />;

                    const isAvailable = availabilityMap[slot.id] !== false;

                    return (
                      <td key={day} className="p-2 border-r border-border/60">
                        <button
                          type="button"
                          onClick={() => toggleSlotAvailability(slot.id)}
                          className={`w-full h-12 rounded-md border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isAvailable
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20'
                          }`}
                        >
                          {isAvailable ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-[11px] font-medium">Available</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-[11px] font-medium">Blocked</span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
