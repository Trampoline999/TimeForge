/**
 * Constraint Validator
 * Performs both incremental checks (for individual candidate slot allocations and manual drag-and-drop moves)
 * and comprehensive full-timetable audits against all college hard & soft constraints.
 */

/**
 * Validates a single proposed assignment against all hard constraints.
 * 
 * @param {Object} candidate - Proposed assignment { division, subject, faculty, room, timeSlots }
 * @param {Array} currentAssignments - Already confirmed assignments
 * @param {Object} maps - Lookup structures for availability, qualifications, etc.
 * @returns {Object} { isValid: boolean, error?: string, conflictType?: string }
 */
export function validateCandidateAssignment(candidate, currentAssignments, maps) {
  const { division, subject, faculty, room, timeSlots } = candidate;
  const { facultyAvailabilityMap, divisionAvailabilityMap, facultyQualifications } = maps;

  // 1. Room Type Constraint
  if (subject.requiredRoomType && room.roomType !== subject.requiredRoomType) {
    return {
      isValid: false,
      conflictType: 'ROOM_TYPE_CONFLICT',
      error: `Room '${room.roomNumber}' is of type '${room.roomType}', but subject '${subject.name}' requires '${subject.requiredRoomType}'.`,
    };
  }

  // 2. Room Capacity Constraint
  if (room.capacity < division.studentCount) {
    return {
      isValid: false,
      conflictType: 'ROOM_CAPACITY_CONFLICT',
      error: `Room '${room.roomNumber}' capacity (${room.capacity}) is insufficient for division '${division.name}' (${division.studentCount} students).`,
    };
  }

  // 3. Faculty Qualification Constraint
  const qualKey = `${faculty.id}_${subject.id}`;
  if (!facultyQualifications.has(qualKey)) {
    return {
      isValid: false,
      conflictType: 'FACULTY_NOT_QUALIFIED',
      error: `Faculty '${faculty.name}' is not authorized/qualified to teach '${subject.name}'.`,
    };
  }

  // Check across all time slots occupied by this session (e.g. 1 slot or 2 consecutive slots)
  for (const slot of timeSlots) {
    // 4. Faculty Availability Constraint
    const facAvailKey = `${faculty.id}_${slot.id}`;
    if (facultyAvailabilityMap.get(facAvailKey) === false) {
      return {
        isValid: false,
        conflictType: 'FACULTY_UNAVAILABLE',
        error: `Faculty '${faculty.name}' has marked ${slot.day} Period P${slot.periodNumber} as unavailable.`,
      };
    }

    // 5. Division Availability Constraint
    const divAvailKey = `${division.id}_${slot.id}`;
    if (divisionAvailabilityMap.get(divAvailKey) === false) {
      return {
        isValid: false,
        conflictType: 'DIVISION_UNAVAILABLE',
        error: `Division '${division.name}' is not available on ${slot.day} Period P${slot.periodNumber}.`,
      };
    }

    // Check collisions with currently scheduled sessions
    for (const assigned of currentAssignments) {
      // Check if assigned session occupies this slot
      const occupiesSlot = assigned.slotIds.includes(slot.id);
      if (!occupiesSlot) continue;

      // 6. Faculty Conflict (Cross-department & Intra-department)
      if (assigned.facultyId === faculty.id) {
        return {
          isValid: false,
          conflictType: 'FACULTY_CONFLICT',
          error: `Faculty '${faculty.name}' is already teaching '${assigned.subjectName}' for division '${assigned.divisionName}' on ${slot.day} Period P${slot.periodNumber}.`,
        };
      }

      // 7. Division Conflict
      if (assigned.divisionId === division.id) {
        return {
          isValid: false,
          conflictType: 'DIVISION_CONFLICT',
          error: `Division '${division.name}' already has '${assigned.subjectName}' scheduled on ${slot.day} Period P${slot.periodNumber}.`,
        };
      }

      // 8. Room Conflict (Shared or Departmental)
      if (assigned.roomId === room.id) {
        return {
          isValid: false,
          conflictType: 'ROOM_CONFLICT',
          error: `Room '${room.roomNumber}' is already occupied by division '${assigned.divisionName}' for '${assigned.subjectName}' on ${slot.day} Period P${slot.periodNumber}.`,
        };
      }
    }
  }

  // 9. Consecutive Period Guarantee for Lab / Multi-period sessions
  if (timeSlots.length > 1) {
    const day = timeSlots[0].day;
    for (let i = 1; i < timeSlots.length; i++) {
      if (timeSlots[i].day !== day) {
        return {
          isValid: false,
          conflictType: 'CONSECUTIVE_SLOT_UNAVAILABLE',
          error: `Multi-period lab session must be on the same day.`,
        };
      }
      if (timeSlots[i].periodNumber !== timeSlots[i - 1].periodNumber + 1) {
        return {
          isValid: false,
          conflictType: 'CONSECUTIVE_SLOT_UNAVAILABLE',
          error: `Multi-period lab session requires contiguous periods (P${timeSlots[i - 1].periodNumber} and P${timeSlots[i].periodNumber} are not consecutive).`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Calculates a soft constraint score (lower penalty is better).
 */
export function calculateSoftPenalty(candidate, currentAssignments) {
  let penalty = 0;
  const { division, subject, timeSlots } = candidate;
  const candidateDay = timeSlots[0].day;

  // Penalty 1: Avoid same subject twice on the same day (unless it's a lab)
  if (subject.type === 'THEORY') {
    const sameSubDayCount = currentAssignments.filter(
      a => a.divisionId === division.id && 
           a.subjectId === subject.id && 
           a.day === candidateDay
    ).length;

    if (sameSubDayCount > 0) {
      penalty += 30 * sameSubDayCount; // heavily penalize clustering same theory subject on same day
    }
  }

  // Penalty 2: Prefer balanced distribution across days
  const divDayAssignments = currentAssignments.filter(
    a => a.divisionId === division.id && a.day === candidateDay
  );
  if (divDayAssignments.length >= 4) {
    penalty += 15; // penalize overstuffing one day
  }

  return penalty;
}

/**
 * Validates an entire existing timetable and returns a complete list of detected conflicts.
 */
export function auditTimetable(entries, maps) {
  const conflicts = [];
  const { rooms, subjects, faculty, divisions, facultyAvailabilityMap, divisionAvailabilityMap } = maps;

  const roomMap = new Map(rooms.map(r => [r.id, r]));
  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const facultyMap = new Map(faculty.map(f => [f.id, f]));
  const divisionMap = new Map(divisions.map(d => [d.id, d]));

  // Index entries by slotId
  const slotEntries = new Map();
  for (const entry of entries) {
    const list = slotEntries.get(entry.timeSlotId) || [];
    list.push(entry);
    slotEntries.set(entry.timeSlotId, list);
  }

  for (const [slotId, slotGroup] of slotEntries.entries()) {
    // Check faculty collisions
    const facultySeen = new Map();
    for (const e of slotGroup) {
      if (facultySeen.has(e.facultyId)) {
        const fac = facultyMap.get(e.facultyId);
        const prev = facultySeen.get(e.facultyId);
        conflicts.push({
          type: 'FACULTY_CONFLICT',
          severity: 'HARD',
          description: `Faculty ${fac?.name || 'Unknown'} is scheduled for both ${prev.division?.name || 'Div A'} and ${e.division?.name || 'Div B'} at the same time.`,
          affectedResources: { facultyId: e.facultyId, timeSlotId: slotId, entries: [prev.id, e.id] },
          suggestedResolution: 'Move one session to a different time slot or reassign faculty.',
        });
      } else {
        facultySeen.set(e.facultyId, e);
      }
    }

    // Check division collisions
    const divisionSeen = new Map();
    for (const e of slotGroup) {
      if (divisionSeen.has(e.divisionId)) {
        const div = divisionMap.get(e.divisionId);
        const prev = divisionSeen.get(e.divisionId);
        conflicts.push({
          type: 'DIVISION_CONFLICT',
          severity: 'HARD',
          description: `Division ${div?.name || 'Unknown'} has multiple simultaneous subjects scheduled.`,
          affectedResources: { divisionId: e.divisionId, timeSlotId: slotId, entries: [prev.id, e.id] },
          suggestedResolution: 'Move one subject to an open period.',
        });
      } else {
        divisionSeen.set(e.divisionId, e);
      }
    }

    // Check room collisions
    const roomSeen = new Map();
    for (const e of slotGroup) {
      if (roomSeen.has(e.roomId)) {
        const rm = roomMap.get(e.roomId);
        const prev = roomSeen.get(e.roomId);
        conflicts.push({
          type: 'ROOM_CONFLICT',
          severity: 'HARD',
          description: `Room ${rm?.roomNumber || 'Unknown'} is occupied by both ${prev.division?.name || 'Div A'} and ${e.division?.name || 'Div B'}.`,
          affectedResources: { roomId: e.roomId, timeSlotId: slotId, entries: [prev.id, e.id] },
          suggestedResolution: 'Assign another available room to one of the divisions.',
        });
      } else {
        roomSeen.set(e.roomId, e);
      }
    }
  }

  return conflicts;
}
