import prisma from '../config/prisma.js';

export async function getDashboardStats(req, res) {
  try {
    const [
      departmentsCount,
      divisionsCount,
      facultyCount,
      roomsCount,
      subjectsCount,
      timetables,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.department.count({ where: { active: true } }),
      prisma.division.count({ where: { active: true } }),
      prisma.faculty.count({ where: { active: true } }),
      prisma.room.count({ where: { active: true } }),
      prisma.subject.count(),
      prisma.timetable.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          academicYear: true,
          semester: true,
          department: true,
          _count: { select: { entries: true, conflicts: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 8,
      }),
    ]);

    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { status: 'ACTIVE' },
    });

    const publishedCount = await prisma.timetable.count({ where: { status: 'PUBLISHED' } });
    const generatedCount = await prisma.timetable.count({ where: { status: 'GENERATED' } });

    res.json({
      stats: {
        departmentsCount,
        divisionsCount,
        facultyCount,
        roomsCount,
        subjectsCount,
        publishedCount,
        generatedCount,
        activeAcademicYear: activeAcademicYear?.name || '2026-27',
      },
      recentTimetables: timetables,
      recentAuditLogs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
