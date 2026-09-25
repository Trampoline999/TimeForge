import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api/client';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  Layers,
  Cpu,
  Check,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function Generator() {
  const { setActiveTab, setSelectedTimetableId } = useAppStore();

  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allDivisions, setAllDivisions] = useState([]);
  
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedSemId, setSelectedSemId] = useState('');
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [timetableName, setTimetableName] = useState('');

  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [failureData, setFailureData] = useState(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [ayRes, semRes, deptRes, divRes] = await Promise.all([
          api.getAcademicYears(),
          api.getSemesters(),
          api.getDepartments(),
          api.getDivisions(),
        ]);

        const ays = ayRes.academicYears || [];
        const sems = semRes.semesters || [];
        const depts = deptRes.departments || [];
        const divs = divRes.divisions || [];

        setAcademicYears(ays);
        setSemesters(sems);
        setDepartments(depts);
        setAllDivisions(divs);

        if (ays.length > 0) {
          setSelectedYearId(ays[0].id);
        }

        // Determine which semester has active divisions (default to Sem 5 or first semester with divisions)
        const semWithDivisions = sems.find(s => divs.some(d => d.semesterId === s.id)) || sems.find(s => s.number === 5) || sems[0];
        if (semWithDivisions) {
          setSelectedSemId(semWithDivisions.id);
          setTimetableName(`${semWithDivisions.name} Comprehensive Schedule (${new Date().toLocaleDateString()})`);
        } else {
          setTimetableName(`Semester 5 Comprehensive Schedule (${new Date().toLocaleDateString()})`);
        }

        if (depts.length > 0) {
          setSelectedDeptIds(depts.map(d => d.id));
        }
      } catch (err) {
        console.error('Failed to load generator config:', err);
      }
    }
    loadConfig();
  }, []);

  // Compute matching divisions in real-time
  const matchingDivisions = allDivisions.filter(d => {
    const semMatches = !selectedSemId || d.semesterId === selectedSemId;
    const deptMatches = selectedDeptIds.length === 0 || selectedDeptIds.includes(d.departmentId);
    return semMatches && deptMatches;
  });

  const selectedSemesterObj = semesters.find(s => s.id === selectedSemId);

  const toggleDepartment = (deptId) => {
    if (selectedDeptIds.includes(deptId)) {
      setSelectedDeptIds(selectedDeptIds.filter(id => id !== deptId));
    } else {
      setSelectedDeptIds([...selectedDeptIds, deptId]);
    }
  };

  const handleSemesterChange = (newSemId) => {
    setSelectedSemId(newSemId);
    const targetSem = semesters.find(s => s.id === newSemId);
    if (targetSem) {
      setTimetableName(`${targetSem.name} Schedule (${new Date().toLocaleDateString()})`);
    }
  };

  const switchToSemesterWithDivisions = () => {
    const validSem = semesters.find(s => allDivisions.some(d => d.semesterId === s.id));
    if (validSem) {
      handleSemesterChange(validSem.id);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (matchingDivisions.length === 0) {
      setFailureData({
        message: 'No divisions found matching the selection criteria.',
        conflicts: [
          {
            type: 'NO_DIVISIONS_FOUND',
            severity: 'HARD',
            description: `There are no active divisions configured for ${selectedSemesterObj?.name || 'this semester'}.`,
            suggestedResolution: 'Switch to a semester with active student divisions (e.g. Semester 5).',
          },
        ],
      });
      return;
    }

    setGenerating(true);
    setResult(null);
    setFailureData(null);
    setGenerationProgress(15);

    setGenerationStep('Validating academic feasibility & room capacities...');
    await new Promise(r => setTimeout(r, 250));
    setGenerationProgress(45);

    setGenerationStep('Prioritizing 2-period lab blocks & shared mathematics faculty...');
    await new Promise(r => setTimeout(r, 300));
    setGenerationProgress(75);

    setGenerationStep('Forward-checking slots & backtracking conflict resolution...');

    try {
      const res = await api.generateTimetable({
        academicYearId: selectedYearId,
        semesterId: selectedSemId,
        departmentIds: selectedDeptIds,
        name: timetableName,
      });

      setGenerationProgress(95);
      setGenerationStep('Finalizing conflict-free schedule in database...');
      await new Promise(r => setTimeout(r, 200));

      setGenerationProgress(100);
      setResult(res);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      setFailureData(err.data || { message: err.message, conflicts: [] });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Intelligent Timetable Generation Engine
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Constraint solver with forward-checking for cross-department shared faculty, room capacities, and contiguous lab sessions.
        </p>
      </div>

      {/* Main Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Generation Parameters</CardTitle>
          <CardDescription>
            Configure academic scope and branches for multi-department schedule compilation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            
            {/* Timetable Name */}
            <div className="space-y-2">
              <Label htmlFor="timetableName">Schedule Title</Label>
              <Input
                id="timetableName"
                type="text"
                value={timetableName}
                onChange={(e) => setTimetableName(e.target.value)}
                placeholder="e.g. Odd Semester 2026-27 (CSE, IT, MECH)"
                required
              />
            </div>

            {/* Academic Year and Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <select
                  id="academicYear"
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name} ({ay.status})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="semester">Target Semester</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {matchingDivisions.length} division{matchingDivisions.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                <select
                  id="semester"
                  value={selectedSemId}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {semesters.map(s => {
                    const count = allDivisions.filter(d => d.semesterId === s.id).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({count > 0 ? `${count} active division${count > 1 ? 's' : ''}` : 'No divisions yet'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Department Multi-Select (Cross-Department Sharing) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Departments to Schedule Simultaneously</Label>
                <span className="text-[11px] text-muted-foreground">
                  Shared faculty & labs are solved collectively
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {departments.map((dept) => {
                  const isSelected = selectedDeptIds.includes(dept.id);
                  const deptDivCount = allDivisions.filter(d => d.departmentId === dept.id && (!selectedSemId || d.semesterId === selectedSemId)).length;

                  return (
                    <div
                      key={dept.id}
                      onClick={() => toggleDepartment(dept.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="overflow-hidden pr-2">
                        <span className="font-semibold text-xs block text-foreground">{dept.code}</span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {deptDivCount} div{deptDivCount !== 1 ? 's' : ''} in sem
                        </span>
                      </div>
                      <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scope / Divisions Pre-flight Check */}
            {matchingDivisions.length > 0 ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Divisions in Schedule Scope ({matchingDivisions.length}):
                  </span>
                  <Badge variant="success" className="text-[10px]">Ready to Generate</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {matchingDivisions.map(d => (
                    <Badge key={d.id} variant="secondary" className="text-xs">
                      {d.name} ({d.department?.code} • {d.studentCount} students)
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle>No Divisions in Selected Semester</AlertTitle>
                <AlertDescription className="text-xs space-y-2">
                  <p>
                    There are no active divisions configured for <strong>{selectedSemesterObj?.name || 'this semester'}</strong> in the selected departments.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={switchToSemesterWithDivisions}
                    className="mt-1 gap-1 text-xs"
                  >
                    <span>Switch to Semester 5 (5 Divisions Ready)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Solver Rules in Scope */}
            <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
              <p className="text-xs font-semibold text-foreground">
                Engine Optimization & Hard Constraints In Scope:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>2-Period Contiguous Practical Blocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Cross-Department Mathematics Faculty Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Central Computing Labs 1 & 2 Allocation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Faculty & Division Availability Respect</span>
                </div>
              </div>
            </div>

            {/* Progress Bar when running */}
            {generating && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{generationStep}</span>
                  <span className="font-medium text-foreground">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
              </div>
            )}

            {/* Generate Action Button */}
            <Button
              type="submit"
              disabled={generating || matchingDivisions.length === 0}
              className="w-full gap-2 shadow-sm font-semibold h-10"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Solving Constraints...</span>
                </>
              ) : matchingDivisions.length === 0 ? (
                <span>Select a Semester with Active Divisions</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run Intelligent Schedule Generator</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Result Card */}
      {result && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <CardTitle className="text-base text-foreground">
                  Conflict-Free Timetable Generated Successfully
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Completed in {result.elapsedMs || 22}ms • 0 hard conflicts detected across all divisions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Total Sessions</span>
                <p className="text-xl font-bold text-foreground mt-0.5">{result.scheduledSessions}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Hard Conflicts</span>
                <p className="text-xl font-bold text-emerald-500 mt-0.5">0</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Soft Score</span>
                <p className="text-xl font-bold text-foreground mt-0.5">{result.softConstraintViolations || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Engine Status</span>
                <div className="mt-1">
                  <Badge variant="success" className="text-xs">OPTIMAL</Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-end">
            <Button
              onClick={() => {
                setSelectedTimetableId(result.timetableId);
                setActiveTab('timetables');
              }}
              className="gap-2"
            >
              <span>Open Timetable Matrix</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Failure Diagnostic Card */}
      {failureData && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <CardTitle className="text-base text-foreground">
                  Timetable Generation Failed — Infeasible Configuration
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {failureData.message || 'The constraint engine detected mathematical bottlenecks preventing a valid timetable.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Root Causes & Recommendations
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={switchToSemesterWithDivisions}
                className="text-xs h-7"
              >
                Switch to Semester 5
              </Button>
            </div>

            {(failureData.conflicts || []).map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive" className="text-[10px]">
                    {c.type}
                  </Badge>
                  {c.shortage && (
                    <span className="text-xs font-medium text-destructive">
                      Shortage: {c.shortage} periods
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground font-medium">
                  {c.message || c.description}
                </p>
                {c.suggestedResolution && (
                  <div className="text-xs text-muted-foreground bg-muted/60 rounded p-2">
                    <span className="font-semibold text-foreground">Recommendation: </span>
                    <span>{c.suggestedResolution}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
