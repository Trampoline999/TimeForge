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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading academic resources...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          College Academic Resources
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage departments, student divisions, faculty teaching qualifications, subjects, and laboratory spaces.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="faculty" className="gap-2 text-xs">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Faculty ({faculty.length})</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2 text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Subjects ({subjects.length})</span>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-2 text-xs">
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Rooms & Labs ({rooms.length})</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2 text-xs">
            <Building2 className="h-3.5 w-3.5" />
            <span>Departments ({departments.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FACULTY */}
        <TabsContent value="faculty" className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculty.map((f) => {
              const isShared = f.name.includes('Shared');
              return (
                <Card key={f.id} className="flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <CardTitle className="text-sm font-semibold">{f.name}</CardTitle>
                          {isShared && (
                            <Badge variant="purple" className="text-[9px] px-1.5 py-0 h-4">
                              SHARED
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs mt-0.5">
                          {f.designation} • {f.department?.code}
                        </CardDescription>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {f.employeeCode}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      <span className="text-[11px] font-medium text-muted-foreground block">Authorized Subjects:</span>
                      <div className="flex flex-wrap gap-1">
                        {(f.facultySubjects || []).length === 0 ? (
                          <span className="text-xs text-destructive italic">No subjects authorized yet</span>
                        ) : (
                          f.facultySubjects.map(fs => (
                            <Badge key={fs.id} variant="secondary" className="text-[10px] font-normal">
                              {fs.subject?.code}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openFacultySubjectModal(f)}
                        className="text-xs h-8"
                      >
                        Authorize Subjects
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: SUBJECTS */}
        <TabsContent value="subjects" className="pt-1">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Dept / Sem</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sessions/Wk</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Facility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-semibold text-foreground text-xs">
                      {s.code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-xs">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {s.department?.code} • {s.semester?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.type === 'LAB' ? 'purple' : 'secondary'} className="text-[10px]">
                        {s.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground text-xs font-medium">
                      {s.weeklySessions} sessions
                    </TableCell>
                    <TableCell className="text-foreground text-xs font-medium">
                      {s.duration} period{s.duration > 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {s.requiredRoomType}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB 3: ROOMS */}
        <TabsContent value="rooms" className="pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{r.roomNumber}</CardTitle>
                    <Badge variant={r.isShared ? 'purple' : 'outline'} className="text-[10px]">
                      {r.isShared ? 'COLLEGE SHARED' : r.department?.code || 'DEPARTMENT'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{r.building}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{r.roomType}</span>
                  <span className="text-muted-foreground font-medium">Capacity: {r.capacity}</span>
                </CardContent>
              </Card>
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
