import prisma from '../config/prisma.js';

// ==================== DEPARTMENTS ====================
export async function getDepartments(req, res) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { faculty: true, divisions: true, subjects: true, rooms: true },
        },
      },
      orderBy: { code: 'asc' },
    });
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, code, description } = req.body;
    const department = await prisma.department.create({
      data: { name, code: code.toUpperCase(), description },
    });
    res.status(201).json({ department });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, code, description, active } = req.body;
    const department = await prisma.department.update({
      where: { id },
      data: { name, code: code?.toUpperCase(), description, active },
    });
    res.json({ department });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// ==================== ACADEMIC YEARS & SEMESTERS ====================
export async function getAcademicYears(req, res) {
  try {
    const academicYears = await prisma.academicYear.findMany({
      include: { semesters: { orderBy: { number: 'asc' } } },
      orderBy: { name: 'desc' },
    });
    res.json({ academicYears });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSemesters(req, res) {
  try {
    const { academicYearId } = req.query;
    const where = academicYearId ? { academicYearId } : {};
    const semesters = await prisma.semester.findMany({
      where,
      include: { academicYear: true },
      orderBy: { number: 'asc' },
    });
    res.json({ semesters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== DIVISIONS ====================
export async function getDivisions(req, res) {
  try {
    const { departmentId, semesterId } = req.query;
    const where = {};
    if (departmentId) where.departmentId = departmentId;
    if (semesterId) where.semesterId = semesterId;

    const divisions = await prisma.division.findMany({
      where,
      include: {
        department: true,
        semester: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json({ divisions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createDivision(req, res) {
  try {
    const { name, departmentId, semesterId, studentCount } = req.body;
    const division = await prisma.division.create({
      data: {
        name,
        departmentId,
        semesterId,
        studentCount: parseInt(studentCount, 10) || 60,
      },
      include: { department: true, semester: true },
    });
    res.status(201).json({ division });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateDivision(req, res) {
  try {
    const { id } = req.params;
    const { name, studentCount, active } = req.body;
    const division = await prisma.division.update({
      where: { id },
      data: {
        name,
        studentCount: studentCount ? parseInt(studentCount, 10) : undefined,
        active,
      },
    });
    res.json({ division });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// ==================== SUBJECTS ====================
export async function getSubjects(req, res) {
  try {
    const { departmentId, semesterId } = req.query;
    const where = {};
    if (departmentId) where.departmentId = departmentId;
    if (semesterId) where.semesterId = semesterId;

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        department: true,
        semester: true,
        facultySubjects: {
          include: { faculty: true },
        },
      },
      orderBy: { code: 'asc' },
    });
    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createSubject(req, res) {
  try {
    const {
      name,
      code,
      departmentId,
      semesterId,
      type,
      weeklySessions,
      duration,
      requiredRoomType,
      color,
    } = req.body;

    const subject = await prisma.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
        departmentId,
        semesterId,
        type: type || 'THEORY',
        weeklySessions: parseInt(weeklySessions, 10) || 3,
        duration: parseInt(duration, 10) || 1,
        requiredRoomType: requiredRoomType || 'CLASSROOM',
        color: color || '#3b82f6',
      },
      include: { department: true, semester: true },
    });
    res.status(201).json({ subject });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// ==================== FACULTY ====================
export async function getFaculty(req, res) {
  try {
    const { departmentId } = req.query;
    const where = departmentId ? { departmentId } : {};

    const faculty = await prisma.faculty.findMany({
      where,
      include: {
        department: true,
        facultySubjects: {
          include: { subject: true },
        },
        availability: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json({ faculty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createFaculty(req, res) {
  try {
    const { name, employeeCode, email, departmentId, designation, maxWeeklyLoad } = req.body;
    const faculty = await prisma.faculty.create({
      data: {
        name,
        employeeCode,
        email,
        departmentId,
        designation: designation || 'Assistant Professor',
        maxWeeklyLoad: parseInt(maxWeeklyLoad, 10) || 18,
      },
      include: { department: true },
    });
    res.status(201).json({ faculty });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function assignFacultySubjects(req, res) {
  try {
    const { facultyId } = req.params;
    const { subjectIds } = req.body; // Array of subject UUIDs

    // Remove existing assignments
    await prisma.facultySubject.deleteMany({
      where: { facultyId },
    });

    // Create new assignments
    if (subjectIds && subjectIds.length > 0) {
      await prisma.facultySubject.createMany({
        data: subjectIds.map(subjectId => ({
          facultyId,
          subjectId,
        })),
      });
    }

    const updated = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        facultySubjects: { include: { subject: true } },
      },
    });

    res.json({ faculty: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// ==================== ROOMS ====================
export async function getRooms(req, res) {
  try {
    const { roomType, isShared, departmentId } = req.query;
    const where = {};
    if (roomType) where.roomType = roomType;
    if (isShared !== undefined) where.isShared = isShared === 'true';
    if (departmentId) where.departmentId = departmentId;

    const rooms = await prisma.room.findMany({
      where,
      include: { department: true },
      orderBy: [{ building: 'asc' }, { roomNumber: 'asc' }],
    });
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createRoom(req, res) {
  try {
    const { roomNumber, building, capacity, roomType, departmentId, isShared } = req.body;
    const room = await prisma.room.create({
      data: {
        roomNumber,
        building,
        capacity: parseInt(capacity, 10) || 70,
        roomType: roomType || 'CLASSROOM',
        departmentId: isShared ? null : departmentId,
        isShared: isShared === true || isShared === 'true',
      },
      include: { department: true },
    });
    res.status(201).json({ room });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// ==================== TIME SLOTS ====================
export async function getTimeSlots(req, res) {
  try {
    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: [{ day: 'asc' }, { periodNumber: 'asc' }],
    });
    res.json({ timeSlots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== AVAILABILITY ====================
export async function getFacultyAvailability(req, res) {
  try {
    const { facultyId } = req.params;
    const availability = await prisma.facultyAvailability.findMany({
      where: { facultyId },
      include: { timeSlot: true },
    });
    res.json({ availability });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function setFacultyAvailability(req, res) {
  try {
    const { facultyId, timeSlotId, isAvailable, isPreferred } = req.body;

    const entry = await prisma.facultyAvailability.upsert({
      where: {
        facultyId_timeSlotId: { facultyId, timeSlotId },
      },
      update: {
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        isPreferred: isPreferred !== undefined ? isPreferred : false,
      },
      create: {
        facultyId,
        timeSlotId,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        isPreferred: isPreferred !== undefined ? isPreferred : false,
      },
    });

    res.json({ availability: entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function setDivisionAvailability(req, res) {
  try {
    const { divisionId, timeSlotId, isAvailable } = req.body;

    const entry = await prisma.divisionAvailability.upsert({
      where: {
        divisionId_timeSlotId: { divisionId, timeSlotId },
      },
      update: { isAvailable },
      create: { divisionId, timeSlotId, isAvailable },
    });

    res.json({ availability: entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
