import prisma from '../config/prisma.js';
import { checkFeasibility } from './feasibilityChecker.js';
import { validateCandidateAssignment, calculateSoftPenalty } from './constraintValidator.js';

export async function generateCollegeTimetable({
  academicYearId,
  semesterId,
  departmentIds = [],
  name,
}) {
  const startTime = Date.now();

  // 1. Fetch active Time Slots ordered by day and period
  const timeSlots = await prisma.timeSlot.findMany({
    where: { active: true, isBreak: false },
    orderBy: [{ day: 'asc' }, { periodNumber: 'asc' }],
  });

  // 2. Fetch Divisions
  const divisionWhere = { active: true };
  if (departmentIds && departmentIds.length > 0) {
    divisionWhere.departmentId = { in: departmentIds };
  }
  if (semesterId) {
    divisionWhere.semesterId = semesterId;
  }
  const divisions = await prisma.division.findMany({
    where: divisionWhere,
    include: {
      department: true,
      semester: true,
      availability: true,
    },
  });

  if (divisions.length === 0) {
    const existingDivisions = await prisma.division.findMany({
      where: { active: true },
      include: { semester: true },
    });
    const availableSemesters = [...new Set(existingDivisions.map(d => d.semester?.name).filter(Boolean))];

    return {
      status: 'FAILED',
      message: 'No divisions found matching the selection criteria.',
      conflicts: [
        {
          type: 'NO_DIVISIONS_FOUND',
          severity: 'HARD',
          description: availableSemesters.length > 0
            ? `No active divisions found for the chosen criteria. Active divisions currently exist in: ${availableSemesters.join(', ')}.`
            : 'No active divisions found in the database. Please add divisions in Academic Resources.',
          suggestedResolution: availableSemesters.length > 0
            ? `Select ${availableSemesters.join(' or ')} in the generator parameters.`
            : 'Create divisions for this semester under Academic Resources.',
        },
      ],
    };
  }

  // 3. Fetch Subjects for these divisions
  const semesterIds = [...new Set(divisions.map(d => d.semesterId))];
  const deptIds = [...new Set(divisions.map(d => d.departmentId))];

  const subjects = await prisma.subject.findMany({
    where: {
      semesterId: { in: semesterIds },
      departmentId: { in: deptIds },
    },
    include: {
      department: true,
      semester: true,
      facultySubjects: {
        include: { faculty: true },
      },
    },
  });

  // 4. Fetch all Rooms (both shared across college and department-specific)
  const rooms = await prisma.room.findMany({
    where: {
      active: true,
      OR: [
        { isShared: true },
        { departmentId: { in: deptIds } },
      ],
    },
  });

  // 5. Fetch all Faculty and availability
  const faculty = await prisma.faculty.findMany({
    where: { active: true },
    include: {
      department: true,
      facultySubjects: true,
      availability: true,
    },
  });

  
  // 6. Build fast lookup maps
  const facultyAvailabilityMap = new Map();
  for (const f of faculty) {
    for (const a of f.availability) {
      facultyAvailabilityMap.set(`${f.id}_${a.timeSlotId}`, a.isAvailable);
    }
  }

  const divisionAvailabilityMap = new Map();
  for (const d of divisions) {
    for (const a of d.availability) {
      divisionAvailabilityMap.set(`${d.id}_${a.timeSlotId}`, a.isAvailable);
    }
  }

  const facultyQualifications = new Set();
  for (const f of faculty) {
    for (const fs of f.facultySubjects) {
      facultyQualifications.add(`${f.id}_${fs.subjectId}`);
    }
  }

  const maps = {
    facultyAvailabilityMap,
    divisionAvailabilityMap,
    facultyQualifications,
    rooms,
    subjects,
    faculty,
    divisions,
  };

  // 7. Feasibility Pre-Check
  const feasibilityResult = checkFeasibility({
    divisions,
    subjects,
    faculty,
    rooms,
    timeSlots,
    facultyAvailabilityMap,
    divisionAvailabilityMap,
  });

  if (!feasibilityResult.isFeasible) {
    return {
      status: 'FAILED',
      message: 'Academic configuration is impossible to schedule due to hard resource bottlenecks.',
      conflicts: feasibilityResult.issues,
    };
  }

  // 8. Create Scheduling Tasks
  const tasks = [];
  let taskIdCounter = 1;

  for (const division of divisions) {
    const divSubjects = subjects.filter(
      s => s.departmentId === division.departmentId && s.semesterId === division.semesterId
    );

    for (const subject of divSubjects) {
      // Find qualified faculty for this subject
      const qualifiedFaculty = faculty.filter(f =>
        f.active && f.facultySubjects.some(fs => fs.subjectId === subject.id)
      );

      for (let session = 1; session <= subject.weeklySessions; session++) {
        tasks.push({
          id: taskIdCounter++,
          division,
          subject,
          duration: subject.duration,
          qualifiedFaculty,
          requiredRoomType: subject.requiredRoomType,
          sessionIndex: session,
        });
      }
    }
  }

  // 9. Prioritize Difficult Tasks First (PRD Section 25)
  // Heuristic:
  // 1. Labs (duration > 1)
  // 2. High room requirements (labs vs classrooms)
  // 3. Constrained faculty (fewer qualified faculty or shared faculty)
  tasks.sort((a, b) => {
    // 1. Multi-period sessions first
    if (b.duration !== a.duration) {
      return b.duration - a.duration;
    }

    // 2. Lab room requirements before standard classrooms
    const isLabA = a.requiredRoomType.includes('LAB');
    const isLabB = b.requiredRoomType.includes('LAB');
    if (isLabA !== isLabB) {
      return isLabB ? 1 : -1;
    }

    // 3. Faculty constraints (fewer available qualified teachers)
    if (a.qualifiedFaculty.length !== b.qualifiedFaculty.length) {
      return a.qualifiedFaculty.length - b.qualifiedFaculty.length;
    }

    // 4. Shared faculty sessions prioritized
    const sharedA = a.qualifiedFaculty.some(f => f.name.includes('Shared'));
    const sharedB = b.qualifiedFaculty.some(f => f.name.includes('Shared'));
    if (sharedA !== sharedB) {
      return sharedB ? 1 : -1;
    }

    return 0;
  });

  // 10. Generate Candidate Slot Options
  // Group slots by day
  const slotsByDay = new Map();
  for (const slot of timeSlots) {
    const list = slotsByDay.get(slot.day) || [];
    list.push(slot);
    slotsByDay.set(slot.day, list);
  }

  // Generate valid slot combinations for duration 1 and duration 2
  const singlePeriodSlotOptions = timeSlots.map(s => [s]);

  const doublePeriodSlotOptions = [];
  for (const [day, daySlots] of slotsByDay.entries()) {
    // Consecutive pairs: [P1, P2], [P3, P4], [P5, P6]
    for (let i = 0; i < daySlots.length - 1; i++) {
      const s1 = daySlots[i];
      const s2 = daySlots[i + 1];
      // Consecutive check
      if (s2.periodNumber === s1.periodNumber + 1) {
        doublePeriodSlotOptions.push([s1, s2]);
      }
    }
  }

  // 11. Backtracking Solver with Heuristic Guidance
  const currentAssignments = [];
  let backtrackCount = 0;
  const MAX_BACKTRACK_STEPS = 40000;
  let softPenaltyTotal = 0;

  function solve(taskIndex) {
    if (taskIndex >= tasks.length) {
      return true; // All tasks scheduled successfully!
    }

    backtrackCount++;
    if (backtrackCount > MAX_BACKTRACK_STEPS) {
      return false; // Search exceeded budget
    }

    const task = tasks[taskIndex];
    const { division, subject, duration, qualifiedFaculty, requiredRoomType } = task;

    // Filter compatible rooms
    const compatibleRooms = rooms.filter(
      r => r.active && 
           r.roomType === requiredRoomType && 
           r.capacity >= division.studentCount &&
           (r.isShared || r.departmentId === division.departmentId)
    );

    const slotOptions = duration === 2 ? doublePeriodSlotOptions : singlePeriodSlotOptions;

    // Build and score candidate choices
    const candidates = [];
    for (const fac of qualifiedFaculty) {
      for (const room of compatibleRooms) {
        for (const slots of slotOptions) {
          const candidate = {
            division,
            subject,
            faculty: fac,
            room,
            timeSlots: slots,
          };

          // Fast validation check
          const val = validateCandidateAssignment(candidate, currentAssignments, maps);
          if (val.isValid) {
            const penalty = calculateSoftPenalty(candidate, currentAssignments);
            candidates.push({ candidate, penalty });
          }
        }
      }
    }

    // Sort candidates by soft penalty (lower is better) to guide search towards high quality timetable
    candidates.sort((a, b) => a.penalty - b.penalty);

    for (const { candidate, penalty } of candidates) {
      const assignmentRecord = {
        taskId: task.id,
        divisionId: candidate.division.id,
        divisionName: candidate.division.name,
        subjectId: candidate.subject.id,
        subjectName: candidate.subject.name,
        facultyId: candidate.faculty.id,
        facultyName: candidate.faculty.name,
        roomId: candidate.room.id,
        roomNumber: candidate.room.roomNumber,
        day: candidate.timeSlots[0].day,
        slotIds: candidate.timeSlots.map(s => s.id),
        slots: candidate.timeSlots,
        duration: candidate.subject.duration,
      };

      currentAssignments.push(assignmentRecord);
      softPenaltyTotal += penalty;

      if (solve(taskIndex + 1)) {
        return true;
      }

      // Backtrack
      currentAssignments.pop();
      softPenaltyTotal -= penalty;
    }

    return false; // No candidate worked at this step
  }

  const success = solve(0);
  const elapsedMs = Date.now() - startTime;

  if (!success) {
    // Determine the most constrained unplaced task for diagnostic explanation
    const lastUnscheduledTask = tasks[currentAssignments.length] || tasks[0];

    return {
      status: 'FAILED',
      message: `Failed to find a conflict-free schedule after ${backtrackCount} evaluation steps.`,
      scheduledSessions: currentAssignments.length,
      requiredSessions: tasks.length,
      elapsedMs,
      conflicts: [
        {
          type: 'CONSTRAINED_BOTTLENECK',
          severity: 'HARD',
          description: `Unable to schedule session for '${lastUnscheduledTask.subject.name}' (${lastUnscheduledTask.division.name}) without violating room or faculty constraints.`,
          suggestedResolution: 'Consider increasing available periods or adding additional room capacity for required room type.',
        },
      ],
    };
  }

  // 12. Persist Generated Timetable in PostgreSQL Database
  const createdTimetable = await prisma.timetable.create({
    data: {
      name: name || `Timetable ${new Date().toLocaleDateString()} (${divisions.map(d => d.name).join(', ')})`,
      academicYearId,
      semesterId: semesterId || null,
      departmentId: departmentIds.length === 1 ? departmentIds[0] : null,
      status: 'GENERATED',
      version: 1,
      metadata: {
        totalSessions: tasks.length,
        scheduledSessions: currentAssignments.length,
        elapsedMs,
        backtrackSteps: backtrackCount,
        softPenalty: softPenaltyTotal,
        departmentIds,
        divisionCount: divisions.length,
      },
    },
  });

  // Create entries
  const entryRecords = [];
  for (const assign of currentAssignments) {
    const sessionGroupId = `grp-${assign.taskId}-${Date.now()}`;
    for (const slot of assign.slots) {
      entryRecords.push({
        timetableId: createdTimetable.id,
        divisionId: assign.divisionId,
        subjectId: assign.subjectId,
        facultyId: assign.facultyId,
        roomId: assign.roomId,
        timeSlotId: slot.id,
        duration: assign.duration,
        sessionGroup: sessionGroupId,
      });
    }
  }

  await prisma.timetableEntry.createMany({
    data: entryRecords,
  });

  // Log Audit Action
  await prisma.auditLog.create({
    data: {
      action: 'GENERATE_TIMETABLE',
      entity: 'Timetable',
      entityId: createdTimetable.id,
      details: {
        name: createdTimetable.name,
        sessionsCount: entryRecords.length,
        elapsedMs,
      },
    },
  });

  return {
    status: 'SUCCESS',
    timetableId: createdTimetable.id,
    timetableName: createdTimetable.name,
    scheduledSessions: currentAssignments.length,
    totalEntries: entryRecords.length,
    hardConflicts: 0,
    softConstraintViolations: Math.floor(softPenaltyTotal / 15),
    elapsedMs,
  };
}
