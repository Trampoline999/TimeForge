import test from 'node:test';
import assert from 'node:assert';
import prisma from '../config/prisma.js';
import { generateCollegeTimetable } from '../scheduler/timetableGenerator.js';
import { checkFeasibility } from '../scheduler/feasibilityChecker.js';

test('Feasibility Checker detects period shortage when demand exceeds available slots', () => {
  const mockDivision = { id: 'div-1', name: 'CSE-A', departmentId: 'dept-1', semesterId: 'sem-1' };
  const mockSubjects = [
    { id: 's1', name: 'Massive Subject', departmentId: 'dept-1', semesterId: 'sem-1', weeklySessions: 40, duration: 1, requiredRoomType: 'CLASSROOM' },
  ];
  const mockRooms = [{ id: 'r1', roomType: 'CLASSROOM', capacity: 70, active: true }];
  const mockSlots = Array.from({ length: 30 }, (_, i) => ({ id: `ts-${i}`, active: true, isBreak: false }));

  const result = checkFeasibility({
    divisions: [mockDivision],
    subjects: mockSubjects,
    faculty: [],
    rooms: mockRooms,
    timeSlots: mockSlots,
    facultyAvailabilityMap: new Map(),
    divisionAvailabilityMap: new Map(),
  });

  assert.strictEqual(result.isFeasible, false);
  assert.strictEqual(result.issues[0].type, 'INSUFFICIENT_PERIODS');
  assert.strictEqual(result.issues[0].shortage, 10);
});

test('Intelligent Timetable Generator creates conflict-free college timetable', async () => {
  const academicYear = await prisma.academicYear.findFirst({ where: { status: 'ACTIVE' } });
  const sem5 = await prisma.semester.findFirst({ where: { number: 5 } });
  const cseDept = await prisma.department.findUnique({ where: { code: 'CSE' } });
  const itDept = await prisma.department.findUnique({ where: { code: 'IT' } });

  assert.ok(academicYear, 'Academic year should exist');
  assert.ok(sem5, 'Semester 5 should exist');

  const result = await generateCollegeTimetable({
    academicYearId: academicYear.id,
    semesterId: sem5.id,
    departmentIds: [cseDept.id, itDept.id],
    name: 'Automated Test Timetable CSE & IT',
  });

  assert.strictEqual(result.status, 'SUCCESS');
  assert.strictEqual(result.hardConflicts, 0);
  assert.ok(result.scheduledSessions > 0, 'Should schedule sessions');
  assert.ok(result.timetableId, 'Should return timetableId');

  // Verify entries in database
  const entries = await prisma.timetableEntry.findMany({
    where: { timetableId: result.timetableId },
    include: { timeSlot: true, room: true, faculty: true, division: true },
  });

  // Verify no two entries for same faculty in same time slot
  const facultySlots = new Set();
  for (const entry of entries) {
    const key = `${entry.facultyId}_${entry.timeSlotId}`;
    assert.strictEqual(facultySlots.has(key), false, `Faculty ${entry.faculty.name} conflict at slot ${entry.timeSlotId}`);
    facultySlots.add(key);
  }

  // Verify no two entries for same room in same time slot
  const roomSlots = new Set();
  for (const entry of entries) {
    const key = `${entry.roomId}_${entry.timeSlotId}`;
    assert.strictEqual(roomSlots.has(key), false, `Room ${entry.room.roomNumber} conflict at slot ${entry.timeSlotId}`);
    roomSlots.add(key);
  }

  // Verify no two entries for same division in same time slot
  const divSlots = new Set();
  for (const entry of entries) {
    const key = `${entry.divisionId}_${entry.timeSlotId}`;
    assert.strictEqual(divSlots.has(key), false, `Division ${entry.division.name} conflict at slot ${entry.timeSlotId}`);
    divSlots.add(key);
  }
});
