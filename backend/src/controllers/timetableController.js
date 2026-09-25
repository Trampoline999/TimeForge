import prisma from '../config/prisma.js';
import { generateCollegeTimetable } from '../scheduler/timetableGenerator.js';
import { validateCandidateAssignment, auditTimetable } from '../scheduler/constraintValidator.js';

export async function generate(req, res) {
  try {
    const { academicYearId, semesterId, departmentIds, name } = req.body;

    if (!academicYearId) {
      return res.status(400).json({ error: 'academicYearId is required' });
    }

    const result = await generateCollegeTimetable({
      academicYearId,
      semesterId,
      departmentIds: departmentIds || [],
      name,
    });

    if (result.status === 'FAILED') {
      return res.status(422).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listTimetables(req, res) {
  try {
    const timetables = await prisma.timetable.findMany({
      include: {
        academicYear: true,
        semester: true,
        department: true,
        _count: {
          select: { entries: true, conflicts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ timetables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTimetableById(req, res) {
  try {
    const { id } = req.params;
    const timetable = await prisma.timetable.findUnique({
      where: { id },
      include: {
        academicYear: true,
        semester: true,
        department: true,
        conflicts: true,
        entries: {
          include: {
            division: { include: { department: true } },
            subject: true,
            faculty: true,
            room: true,
            timeSlot: true,
          },
          orderBy: [
            { timeSlot: { day: 'asc' } },
            { timeSlot: { periodNumber: 'asc' } },
          ],
        },
      },
    });

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    res.json({ timetable });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function moveTimetableEntry(req, res) {
  try {
    const { id: timetableId } = req.params;
    const { entryId, newTimeSlotId, newRoomId, newFacultyId } = req.body;

    // 1. Fetch current entry
    const entry = await prisma.timetableEntry.findUnique({
      where: { id: entryId },
      include: {
        division: true,
        subject: true,
        faculty: true,
        room: true,
        timeSlot: true,
      },
    });

    if (!entry || entry.timetableId !== timetableId) {
      return res.status(404).json({ error: 'Timetable entry not found' });
    }

    // 2. Fetch destination objects
    const targetSlot = await prisma.timeSlot.findUnique({ where: { id: newTimeSlotId } });
    const targetRoom = newRoomId 
      ? await prisma.room.findUnique({ where: { id: newRoomId } })
      : entry.room;
    const targetFaculty = newFacultyId
      ? await prisma.faculty.findUnique({ where: { id: newFacultyId } })
      : entry.faculty;

    if (!targetSlot || !targetRoom || !targetFaculty) {
      return res.status(400).json({ error: 'Invalid target slot, room, or faculty' });
    }

    // 3. Fetch all other entries in this timetable (excluding this entry)
    const otherEntries = await prisma.timetableEntry.findMany({
      where: {
        timetableId,
        id: { not: entryId },
      },
      include: {
        division: true,
        subject: true,
        faculty: true,
        room: true,
        timeSlot: true,
      },
    });

    // 4. Load full maps for validator
    const faculty = await prisma.faculty.findMany({
      include: { facultySubjects: true, availability: true },
    });
    const rooms = await prisma.room.findMany();
    const divisions = await prisma.division.findMany({
      include: { availability: true },
    });

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
    };

    // Format current assignments for fast validator check
    const currentAssignments = otherEntries.map(e => ({
      divisionId: e.divisionId,
      divisionName: e.division.name,
      subjectId: e.subjectId,
      subjectName: e.subject.name,
      facultyId: e.facultyId,
      facultyName: e.faculty.name,
      roomId: e.roomId,
      roomNumber: e.room.roomNumber,
      day: e.timeSlot.day,
      slotIds: [e.timeSlotId],
    }));

    // 5. Run Strict Constraint Validation
    const candidate = {
      division: entry.division,
      subject: entry.subject,
      faculty: targetFaculty,
      room: targetRoom,
      timeSlots: [targetSlot],
    };

    const validation = validateCandidateAssignment(candidate, currentAssignments, maps);

    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        error: validation.error,
        conflictType: validation.conflictType,
      });
    }

    // 6. Perform the Update
    const updatedEntry = await prisma.timetableEntry.update({
      where: { id: entryId },
      data: {
        timeSlotId: targetSlot.id,
        roomId: targetRoom.id,
        facultyId: targetFaculty.id,
      },
      include: {
        division: true,
        subject: true,
        faculty: true,
        room: true,
        timeSlot: true,
      },
    });

    // 7. Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_ENTRY_MOVE',
        entity: 'TimetableEntry',
        entityId: entryId,
        details: {
          timetableId,
          fromSlot: `${entry.timeSlot.day} P${entry.timeSlot.periodNumber}`,
          toSlot: `${targetSlot.day} P${targetSlot.periodNumber}`,
          subject: entry.subject.name,
          division: entry.division.name,
        },
      },
    });

    res.json({
      success: true,
      message: 'Entry moved successfully without conflicts.',
      entry: updatedEntry,
    });
  } catch (error) {
    console.error('Move error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function publishTimetable(req, res) {
  try {
    const { id } = req.params;

    const timetable = await prisma.timetable.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            division: true,
            subject: true,
            faculty: true,
            room: true,
            timeSlot: true,
          },
        },
      },
    });

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    // Audit for any hard conflicts before publishing
    const rooms = await prisma.room.findMany();
    const subjects = await prisma.subject.findMany();
    const faculty = await prisma.faculty.findMany({ include: { availability: true } });
    const divisions = await prisma.division.findMany({ include: { availability: true } });

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

    const conflicts = auditTimetable(timetable.entries, {
      rooms,
      subjects,
      faculty,
      divisions,
      facultyAvailabilityMap,
      divisionAvailabilityMap,
    });

    if (conflicts.length > 0) {
      return res.status(422).json({
        error: `Cannot publish timetable with ${conflicts.length} unresolved hard conflicts.`,
        conflicts,
      });
    }

    const updated = await prisma.timetable.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    await prisma.auditLog.create({
      data: {
        action: 'PUBLISH_TIMETABLE',
        entity: 'Timetable',
        entityId: id,
        details: { name: timetable.name },
      },
    });

    res.json({ success: true, timetable: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function archiveTimetable(req, res) {
  try {
    const { id } = req.params;
    const updated = await prisma.timetable.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    res.json({ success: true, timetable: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteTimetable(req, res) {
  try {
    const { id } = req.params;
    await prisma.timetable.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getConflicts(req, res) {
  try {
    const { id } = req.params;
    const timetable = await prisma.timetable.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            division: true,
            subject: true,
            faculty: true,
            room: true,
            timeSlot: true,
          },
        },
      },
    });

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    const rooms = await prisma.room.findMany();
    const subjects = await prisma.subject.findMany();
    const faculty = await prisma.faculty.findMany({ include: { availability: true } });
    const divisions = await prisma.division.findMany({ include: { availability: true } });

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

    const conflicts = auditTimetable(timetable.entries, {
      rooms,
      subjects,
      faculty,
      divisions,
      facultyAvailabilityMap,
      divisionAvailabilityMap,
    });

    res.json({ conflicts, count: conflicts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
