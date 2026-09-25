import { PrismaClient, Role, SubjectType, RoomType, DayOfWeek, AcademicYearStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for College Timetable Generator...');

  // 1. Clean existing records in correct order
  await prisma.conflict.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.divisionAvailability.deleteMany();
  await prisma.facultyAvailability.deleteMany();
  await prisma.facultySubject.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.division.deleteMany();
  await prisma.room.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.department.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.auditLog.deleteMany();

  // 2. Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2026-27',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-05-31'),
      status: AcademicYearStatus.ACTIVE,
    },
  });

  // 3. Semesters
  const semesters = await Promise.all([
    prisma.semester.create({ data: { number: 1, name: 'Semester 1', academicYearId: academicYear.id } }),
    prisma.semester.create({ data: { number: 3, name: 'Semester 3', academicYearId: academicYear.id } }),
    prisma.semester.create({ data: { number: 5, name: 'Semester 5', academicYearId: academicYear.id } }),
    prisma.semester.create({ data: { number: 7, name: 'Semester 7', academicYearId: academicYear.id } }),
  ]);
  const sem5 = semesters[2];

  // 4. Departments
  const deptCSE = await prisma.department.create({
    data: { name: 'Computer Science and Engineering', code: 'CSE', description: 'Department of Computer Science and Engineering' },
  });
  const deptIT = await prisma.department.create({
    data: { name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
  });
  const deptAIDS = await prisma.department.create({
    data: { name: 'Artificial Intelligence and Data Science', code: 'AI&DS', description: 'Department of AI & Data Science' },
  });
  const deptMECH = await prisma.department.create({
    data: { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' },
  });

  // 5. Time Slots (Monday to Friday, 6 active periods per day)
  const days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
  const periodSchedule = [
    { periodNumber: 1, startTime: '09:00', endTime: '10:00' },
    { periodNumber: 2, startTime: '10:00', endTime: '11:00' },
    { periodNumber: 3, startTime: '11:15', endTime: '12:15' },
    { periodNumber: 4, startTime: '12:15', endTime: '13:15' },
    { periodNumber: 5, startTime: '14:00', endTime: '15:00' },
    { periodNumber: 6, startTime: '15:00', endTime: '16:00' },
  ];

  const timeSlots = [];
  for (const day of days) {
    for (const p of periodSchedule) {
      const slot = await prisma.timeSlot.create({
        data: {
          day,
          periodNumber: p.periodNumber,
          startTime: p.startTime,
          endTime: p.endTime,
          isBreak: false,
          active: true,
        },
      });
      timeSlots.push(slot);
    }
  }

  // 6. Rooms
  const rooms = await Promise.all([
    // Central Shared Labs
    prisma.room.create({
      data: { roomNumber: 'Central Lab 1', building: 'Tech Block A', capacity: 75, roomType: RoomType.COMPUTER_LAB, isShared: true },
    }),
    prisma.room.create({
      data: { roomNumber: 'Central Lab 2', building: 'Tech Block A', capacity: 70, roomType: RoomType.COMPUTER_LAB, isShared: true },
    }),
    // Dept Specific Lab
    prisma.room.create({
      data: { roomNumber: 'CSE Advanced Lab', building: 'CS Block', capacity: 65, roomType: RoomType.COMPUTER_LAB, departmentId: deptCSE.id, isShared: false },
    }),
    prisma.room.create({
      data: { roomNumber: 'Electronics Lab 1', building: 'Core Block', capacity: 60, roomType: RoomType.ELECTRONICS_LAB, isShared: true },
    }),
    prisma.room.create({
      data: { roomNumber: 'Seminar Hall', building: 'Auditorium Wing', capacity: 180, roomType: RoomType.SEMINAR_HALL, isShared: true },
    }),
    // Classrooms
    prisma.room.create({
      data: { roomNumber: 'Room 201', building: 'Academic Block 1', capacity: 75, roomType: RoomType.CLASSROOM, departmentId: deptCSE.id, isShared: false },
    }),
    prisma.room.create({
      data: { roomNumber: 'Room 202', building: 'Academic Block 1', capacity: 75, roomType: RoomType.CLASSROOM, departmentId: deptCSE.id, isShared: false },
    }),
    prisma.room.create({
      data: { roomNumber: 'Room 301', building: 'Academic Block 2', capacity: 70, roomType: RoomType.CLASSROOM, departmentId: deptIT.id, isShared: false },
    }),
    prisma.room.create({
      data: { roomNumber: 'Room 302', building: 'Academic Block 2', capacity: 70, roomType: RoomType.CLASSROOM, departmentId: deptAIDS.id, isShared: false },
    }),
    prisma.room.create({
      data: { roomNumber: 'Room 401', building: 'Mechanical Block', capacity: 65, roomType: RoomType.CLASSROOM, departmentId: deptMECH.id, isShared: false },
    }),
  ]);

  // 7. Divisions (Semester 5)
  const divCSE_A = await prisma.division.create({
    data: { name: 'CSE-A', departmentId: deptCSE.id, semesterId: sem5.id, studentCount: 65 },
  });
  const divCSE_B = await prisma.division.create({
    data: { name: 'CSE-B', departmentId: deptCSE.id, semesterId: sem5.id, studentCount: 62 },
  });
  const divIT_A = await prisma.division.create({
    data: { name: 'IT-A', departmentId: deptIT.id, semesterId: sem5.id, studentCount: 60 },
  });
  const divAIDS_A = await prisma.division.create({
    data: { name: 'AI&DS-A', departmentId: deptAIDS.id, semesterId: sem5.id, studentCount: 55 },
  });
  const divME_A = await prisma.division.create({
    data: { name: 'ME-A', departmentId: deptMECH.id, semesterId: sem5.id, studentCount: 52 },
  });

  // 8. Faculty
  const facultyRahul = await prisma.faculty.create({
    data: { name: 'Prof. Rahul Sharma', employeeCode: 'FAC-CSE-01', email: 'rahul.cse@college.edu', departmentId: deptCSE.id, designation: 'Associate Professor' },
  });
  const facultySneha = await prisma.faculty.create({
    data: { name: 'Prof. Sneha Kulkarni', employeeCode: 'FAC-CSE-02', email: 'sneha.cse@college.edu', departmentId: deptCSE.id, designation: 'Assistant Professor' },
  });
  const facultyVikram = await prisma.faculty.create({
    data: { name: 'Prof. Vikram Patil', employeeCode: 'FAC-IT-01', email: 'vikram.it@college.edu', departmentId: deptIT.id, designation: 'Assistant Professor' },
  });
  const facultyAnjali = await prisma.faculty.create({
    data: { name: 'Prof. Anjali Deshmukh', employeeCode: 'FAC-AIDS-01', email: 'anjali.aids@college.edu', departmentId: deptAIDS.id, designation: 'Assistant Professor' },
  });
  // Shared Faculty across CSE, IT, MECH
  const facultyAmit = await prisma.faculty.create({
    data: { name: 'Prof. Amit Verma (Shared)', employeeCode: 'FAC-MATH-01', email: 'amit.math@college.edu', departmentId: deptCSE.id, designation: 'Professor & Head of Applied Mathematics' },
  });
  const facultyRajesh = await prisma.faculty.create({
    data: { name: 'Prof. Rajesh Joshi', employeeCode: 'FAC-MECH-01', email: 'rajesh.mech@college.edu', departmentId: deptMECH.id, designation: 'Assistant Professor' },
  });

  // 9. Subjects
  // CSE Sem 5 Subjects
  const subDBMS = await prisma.subject.create({
    data: { name: 'Database Management Systems', code: 'CS501', departmentId: deptCSE.id, semesterId: sem5.id, type: SubjectType.THEORY, weeklySessions: 3, duration: 1, requiredRoomType: RoomType.CLASSROOM, color: '#3b82f6' },
  });
  const subDBMSLab = await prisma.subject.create({
    data: { name: 'DBMS Laboratory', code: 'CSL502', departmentId: deptCSE.id, semesterId: sem5.id, type: SubjectType.LAB, weeklySessions: 1, duration: 2, requiredRoomType: RoomType.COMPUTER_LAB, color: '#2563eb' },
  });
  const subOS = await prisma.subject.create({
    data: { name: 'Operating Systems', code: 'CS503', departmentId: deptCSE.id, semesterId: sem5.id, type: SubjectType.THEORY, weeklySessions: 3, duration: 1, requiredRoomType: RoomType.CLASSROOM, color: '#06b6d4' },
  });
  const subOSLab = await prisma.subject.create({
    data: { name: 'OS Laboratory', code: 'CSL504', departmentId: deptCSE.id, semesterId: sem5.id, type: SubjectType.LAB, weeklySessions: 1, duration: 2, requiredRoomType: RoomType.COMPUTER_LAB, color: '#0891b2' },
  });
  const subMathCSE = await prisma.subject.create({
    data: { name: 'Engineering Mathematics V', code: 'CS505', departmentId: deptCSE.id, semesterId: sem5.id, type: SubjectType.THEORY, weeklySessions: 3, duration: 1, requiredRoomType: RoomType.CLASSROOM, color: '#8b5cf6' },
  });

  // IT Sem 5 Subjects
  const subCN = await prisma.subject.create({
    data: { name: 'Computer Networks', code: 'IT501', departmentId: deptIT.id, semesterId: sem5.id, type: SubjectType.THEORY, weeklySessions: 3, duration: 1, requiredRoomType: RoomType.CLASSROOM, color: '#10b981' },
  });
  const subCNLab = await prisma.subject.create({
    data: { name: 'Computer Networks Lab', code: 'ITL502', departmentId: deptIT.id, semesterId: sem5.id, type: SubjectType.LAB, weeklySessions: 1, duration: 2, requiredRoomType: RoomType.COMPUTER_LAB, color: '#059669' },
  });
  const subMathIT = await prisma.subject.create({
    data: { name: 'Engineering Mathematics V', code: 'IT505', departmentId: deptIT.id, semesterId: sem5.id, type: SubjectType.THEORY, weeklySessions: 3, duration: 1, requiredRoomType: RoomType.CLASSROOM, color: '#8b5cf6' },
  });

  // MECH Sem 5 Subjects
  const subThermo = await prisma.subject.create({
    data: { name: 'Applied Thermodynamics', code: 'ME501', departmentId: deptMECH.id, semesterId: sem5.id, type: SubjectType.THEORY, weeklySessions: 4, duration: 1, requiredRoomType: RoomType.CLASSROOM, color: '#f59e0b' },
  });
  const subCADLab = await prisma.subject.create({
    data: { name: 'CAD & Simulation Lab', code: 'MEL502', departmentId: deptMECH.id, semesterId: sem5.id, type: SubjectType.LAB, weeklySessions: 1, duration: 2, requiredRoomType: RoomType.COMPUTER_LAB, color: '#d97706' },
  });

  // 10. Faculty-Subject Qualifications
  await prisma.facultySubject.createMany({
    data: [
      { facultyId: facultyRahul.id, subjectId: subDBMS.id },
      { facultyId: facultyRahul.id, subjectId: subDBMSLab.id },
      { facultyId: facultySneha.id, subjectId: subOS.id },
      { facultyId: facultySneha.id, subjectId: subOSLab.id },
      { facultyId: facultyVikram.id, subjectId: subCN.id },
      { facultyId: facultyVikram.id, subjectId: subCNLab.id },
      { facultyId: facultyAmit.id, subjectId: subMathCSE.id },
      { facultyId: facultyAmit.id, subjectId: subMathIT.id },
      { facultyId: facultyRajesh.id, subjectId: subThermo.id },
      { facultyId: facultyRajesh.id, subjectId: subCADLab.id },
    ],
  });

  // 11. Faculty Availability (Prof. Amit unavailable Friday P5, P6)
  const fridayP5 = timeSlots.find(s => s.day === DayOfWeek.FRIDAY && s.periodNumber === 5);
  const fridayP6 = timeSlots.find(s => s.day === DayOfWeek.FRIDAY && s.periodNumber === 6);
  if (fridayP5) {
    await prisma.facultyAvailability.create({
      data: { facultyId: facultyAmit.id, timeSlotId: fridayP5.id, isAvailable: false },
    });
  }
  if (fridayP6) {
    await prisma.facultyAvailability.create({
      data: { facultyId: facultyAmit.id, timeSlotId: fridayP6.id, isAvailable: false },
    });
  }

  // 12. Users for Role Switcher / Auth
  await prisma.user.createMany({
    data: [
      { email: 'admin@college.edu', name: 'Super Admin', role: Role.SUPER_ADMIN },
      { email: 'hod.cse@college.edu', name: 'Dr. Suresh Kumar (HOD CSE)', role: Role.DEPARTMENT_ADMIN, departmentId: deptCSE.id },
      { email: 'rahul.cse@college.edu', name: 'Prof. Rahul Sharma', role: Role.FACULTY, departmentId: deptCSE.id, facultyId: facultyRahul.id },
      { email: 'student.cse@college.edu', name: 'Student Viewer (CSE)', role: Role.STUDENT, departmentId: deptCSE.id },
    ],
  });

  console.log('✅ College database seeded successfully with comprehensive multi-department test data!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
