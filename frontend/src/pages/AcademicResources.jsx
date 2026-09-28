import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { 
  Building2, 
  Users, 
  BookOpen, 
  DoorOpen, 
  GraduationCap,
  Check,
  Layers,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AcademicResources() {
  const [activeSubTab, setActiveSubTab] = useState('faculty');

  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Assignment states
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [assignedSubjectIds, setAssignedSubjectIds] = useState([]);

  useEffect(() => {
    loadAllResources();
  }, []);

  const loadAllResources = async () => {
    try {
      setLoading(true);
      const [deptRes, divRes, subRes, facRes, rmRes] = await Promise.all([
        api.getDepartments(),
        api.getDivisions(),
        api.getSubjects(),
        api.getFaculty(),
        api.getRooms(),
      ]);
      setDepartments(deptRes.departments || []);
      setDivisions(divRes.divisions || []);
      setSubjects(subRes.subjects || []);
      setFaculty(facRes.faculty || []);
      setRooms(rmRes.rooms || []);
    } catch (err) {
      console.error('Failed to load academic resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const openFacultySubjectModal = (f) => {
    setSelectedFaculty(f);
    setAssignedSubjectIds((f.facultySubjects || []).map(fs => fs.subjectId));
  };

  const handleSaveQualifications = async () => {
    if (!selectedFaculty) return;
    try {
      await api.assignFacultySubjects(selectedFaculty.id, assignedSubjectIds);
      await loadAllResources();
      setSelectedFaculty(null);
    } catch (err) {
      alert(err.message || 'Failed to update faculty qualifications');
    }
  };

  const toggleSubjectQualification = (subId) => {
    if (assignedSubjectIds.includes(subId)) {
      setAssignedSubjectIds(assignedSubjectIds.filter(id => id !== subId));
    } else {
      setAssignedSubjectIds([...assignedSubjectIds, subId]);
    }
  };

  // Search / Filter
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading academic data...</span>
        </div>
      </div>
    );
  }

  const filteredFaculty = faculty.filter(f => 
    !searchQuery || 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.department?.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(s =>
    !searchQuery ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department?.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = rooms.filter(r =>
    !searchQuery ||
    r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.roomType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.building && r.building.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Academic Resources
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Faculty teaching authorizations, subject loads, and room capacities.
          </p>
        </div>

        {/* Minimal Search Input */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Quick search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 px-3 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="h-8 p-0.5 bg-muted/60">
          <TabsTrigger value="faculty" className="h-7 text-xs px-3 gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Faculty ({faculty.length})</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="h-7 text-xs px-3 gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Subjects ({subjects.length})</span>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="h-7 text-xs px-3 gap-1.5">
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Rooms ({rooms.length})</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="h-7 text-xs px-3 gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span>Depts ({departments.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FACULTY */}
        <TabsContent value="faculty" className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredFaculty.map((f) => {
              const isShared = f.name.includes('Shared');
              return (
                <div key={f.id} className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between hover:border-border transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-foreground">{f.name}</span>
                          {isShared && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              SHARED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {f.designation} • {f.department?.code}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {f.employeeCode}
                      </span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-border/60">
                      <span className="text-[11px] text-muted-foreground block">Authorized:</span>
                      <div className="flex flex-wrap gap-1">
                        {(f.facultySubjects || []).length === 0 ? (
                          <span className="text-[11px] text-amber-500/80 italic">No subjects assigned</span>
                        ) : (
                          f.facultySubjects.map(fs => (
                            <span key={fs.id} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/80 font-mono">
                              {fs.subject?.code}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openFacultySubjectModal(f)}
                      className="text-xs h-7 text-primary hover:bg-primary/10"
                    >
                      Authorize
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: SUBJECTS */}
        <TabsContent value="subjects" className="pt-1">
          <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Subject Name</TableHead>
                  <TableHead className="text-xs">Dept / Sem</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Sessions/Wk</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Facility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-medium text-foreground text-xs">
                      {s.code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-xs">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {s.department?.code} • {s.semester?.name}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        s.type === 'LAB' 
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {s.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground text-xs">
                      {s.weeklySessions} sessions
                    </TableCell>
                    <TableCell className="text-foreground text-xs">
                      {s.duration} period{s.duration > 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {s.requiredRoomType}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 3: ROOMS */}
        <TabsContent value="rooms" className="pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRooms.map((r) => (
              <div key={r.id} className="rounded-lg border border-border/80 bg-card p-3.5 hover:border-border transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{r.roomNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    r.isShared ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {r.isShared ? 'COLLEGE SHARED' : r.department?.code || 'DEPT'}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{r.building}</div>
                <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-foreground/80">{r.roomType}</span>
                  <span className="text-muted-foreground text-[11px]">Cap: {r.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: DEPARTMENTS & DIVISIONS */}
        <TabsContent value="departments" className="pt-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{d.name} ({d.code})</CardTitle>
                    <Badge variant="success" className="text-[10px]">ACTIVE</Badge>
                  </div>
                  <CardDescription className="text-xs">{d.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs font-medium text-muted-foreground block mb-2">Student Divisions:</span>
                    <div className="flex flex-wrap gap-2">
                      {divisions.filter(div => div.departmentId === d.id).map(div => (
                        <div key={div.id} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground flex items-center gap-1.5">
                          <span className="font-semibold">{div.name}</span>
                          <span className="text-muted-foreground text-[11px]">({div.studentCount} students)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Faculty Qualification Modal using Shadcn Dialog */}
      <Dialog open={!!selectedFaculty} onOpenChange={(open) => !open && setSelectedFaculty(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Authorize Teaching Subjects</DialogTitle>
            <DialogDescription>
              Select subjects that {selectedFaculty?.name} is certified to teach.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 max-h-72 overflow-y-auto space-y-2 pr-1">
            {subjects.map((sub) => {
              const isSelected = assignedSubjectIds.includes(sub.id);
              return (
                <div
                  key={sub.id}
                  onClick={() => toggleSubjectQualification(sub.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left text-xs transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-foreground block">{sub.code} — {sub.name}</span>
                    <span className="text-[11px] text-muted-foreground">{sub.department?.code} • {sub.type}</span>
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

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setSelectedFaculty(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQualifications}>
              Save Authorization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
