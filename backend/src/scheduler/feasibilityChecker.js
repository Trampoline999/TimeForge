/**
 * Feasibility Checker
 * Performs rigorous pre-generation analysis on academic configuration
 * to guarantee that unsolvable constraint conditions are immediately
 * detected and communicated with clear, actionable diagnostics.
 */

export function checkFeasibility({
  divisions,
  subjects,
  faculty,
  rooms,
  timeSlots,
  facultyAvailabilityMap,
  divisionAvailabilityMap,
}) {
  const issues = [];
  const activeTimeSlots = timeSlots.filter(ts => ts.active && !ts.isBreak);
  const totalUsableSlots = activeTimeSlots.length;

  // 1. Check each division's total weekly period demand vs usable time slots
  for (const division of divisions) {
    const divSubjects = subjects.filter(s => s.departmentId === division.departmentId && s.semesterId === division.semesterId);
    
    let totalPeriodsRequired = 0;
    for (const sub of divSubjects) {
      totalPeriodsRequired += sub.weeklySessions * sub.duration;
    }

    // Usable slots for this division (excluding division unavailable slots)
    const divUnavailableCount = activeTimeSlots.filter(ts => {
      const key = `${division.id}_${ts.id}`;
      return divisionAvailabilityMap.get(key) === false;
    }).length;

    const divAvailableSlots = totalUsableSlots - divUnavailableCount;

    if (totalPeriodsRequired > divAvailableSlots) {
      issues.push({
        type: 'INSUFFICIENT_PERIODS',
        severity: 'HARD',
        divisionId: division.id,
        divisionName: division.name,
        requiredPeriods: totalPeriodsRequired,
        availablePeriods: divAvailableSlots,
        shortage: totalPeriodsRequired - divAvailableSlots,
        message: `Division ${division.name} requires ${totalPeriodsRequired} academic periods per week, but only ${divAvailableSlots} usable periods are available. Shortage: ${totalPeriodsRequired - divAvailableSlots} periods.`,
        suggestedResolution: 'Increase active working periods, reduce unavailable slots, or adjust weekly subject requirements.',
      });
    }
  }

  // 2. Check Lab / Specialized Room capacity vs demand
  const roomTypes = [...new Set(rooms.map(r => r.roomType))];
  const requiredRoomTypes = [...new Set(subjects.map(s => s.requiredRoomType))];

  for (const reqType of requiredRoomTypes) {
    const compatibleRooms = rooms.filter(r => r.active && r.roomType === reqType);
    if (compatibleRooms.length === 0) {
      issues.push({
        type: 'NO_COMPATIBLE_ROOMS',
        severity: 'HARD',
        roomType: reqType,
        message: `No active rooms of required type '${reqType}' are configured in the college.`,
        suggestedResolution: `Add at least one active room with roomType '${reqType}'.`,
      });
      continue;
    }

    // Calculate total periods demanded for this room type across all divisions
    let totalPeriodsDemanded = 0;
    for (const division of divisions) {
      const divSubjects = subjects.filter(
        s => s.departmentId === division.departmentId && 
             s.semesterId === division.semesterId && 
             s.requiredRoomType === reqType
      );
      for (const sub of divSubjects) {
        totalPeriodsDemanded += sub.weeklySessions * sub.duration;
      }
    }

    const totalAvailableRoomPeriods = compatibleRooms.length * totalUsableSlots;
    if (totalPeriodsDemanded > totalAvailableRoomPeriods) {
      issues.push({
        type: reqType.includes('LAB') ? 'INSUFFICIENT_LABS' : 'INSUFFICIENT_ROOMS',
        severity: 'HARD',
        roomType: reqType,
        demandedPeriods: totalPeriodsDemanded,
        availablePeriods: totalAvailableRoomPeriods,
        message: `Total demand for '${reqType}' is ${totalPeriodsDemanded} periods across all divisions, but available compatible rooms provide only ${totalAvailableRoomPeriods} periods.`,
        suggestedResolution: `Add additional ${reqType} facilities or reduce practical sessions requiring this room type.`,
      });
    }
  }

  // 3. Check Faculty Teaching Load vs Available Slots
  for (const fac of faculty) {
    if (!fac.active) continue;

    // Find all subjects this faculty is qualified to teach across departments
    const qualifiedSubjectIds = fac.facultySubjects.map(fs => fs.subjectId);
    const assignedSubjects = subjects.filter(s => qualifiedSubjectIds.includes(s.id));

    let facultyTotalDemand = 0;
    for (const sub of assignedSubjects) {
      // Find divisions that need this subject
      const matchingDivs = divisions.filter(
        d => d.departmentId === sub.departmentId && d.semesterId === sub.semesterId
      );
      facultyTotalDemand += matchingDivs.length * (sub.weeklySessions * sub.duration);
    }

    // Calculate faculty available periods
    const facUnavailableCount = activeTimeSlots.filter(ts => {
      const key = `${fac.id}_${ts.id}`;
      return facultyAvailabilityMap.get(key) === false;
    }).length;

    const facAvailableSlots = totalUsableSlots - facUnavailableCount;

    if (facultyTotalDemand > facAvailableSlots) {
      issues.push({
        type: 'FACULTY_OVERLOAD',
        severity: 'HARD',
        facultyId: fac.id,
        facultyName: fac.name,
        demandedPeriods: facultyTotalDemand,
        availablePeriods: facAvailableSlots,
        message: `Faculty ${fac.name} is assigned ${facultyTotalDemand} periods across divisions, but is only available for ${facAvailableSlots} periods.`,
        suggestedResolution: `Assign additional faculty to subjects or reduce unavailable periods for ${fac.name}.`,
      });
    }
  }

  // 4. Check for subjects with zero qualified faculty
  for (const sub of subjects) {
    const qualifiedFaculty = faculty.filter(f => 
      f.active && f.facultySubjects.some(fs => fs.subjectId === sub.id)
    );
    if (qualifiedFaculty.length === 0) {
      issues.push({
        type: 'FACULTY_NOT_QUALIFIED',
        severity: 'HARD',
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        message: `Subject '${sub.name}' (${sub.code}) has no active qualified faculty assigned to teach it.`,
        suggestedResolution: `Assign at least one qualified faculty member to ${sub.name} in Faculty Management.`,
      });
    }
  }

  return {
    isFeasible: issues.filter(i => i.severity === 'HARD').length === 0,
    issues,
  };
}
