import express from 'express';
import * as authCtrl from '../controllers/authController.js';
import * as academicCtrl from '../controllers/academicController.js';
import * as timetableCtrl from '../controllers/timetableController.js';
import * as dashboardCtrl from '../controllers/dashboardController.js';

const router = express.Router();

// Root API Directory
router.get('/', (req, res) => {
  res.json({
    name: 'Intelligent Engineering College Timetable API',
    status: 'ONLINE',
    version: '1.0.0',
    frontend: 'http://localhost:5173',
    endpoints: {
      dashboard: 'GET /api/dashboard/stats',
      timetables: 'GET /api/timetables',
      generateTimetable: 'POST /api/timetables/generate',
      departments: 'GET /api/departments',
      divisions: 'GET /api/divisions',
      faculty: 'GET /api/faculty',
      rooms: 'GET /api/rooms',
      subjects: 'GET /api/subjects',
      timeSlots: 'GET /api/time-slots',
      auth: 'GET /api/auth/me',
      health: 'GET /health',
    },
  });
});

// ==================== AUTH ====================
router.get('/auth/me', authCtrl.getCurrentUser);
router.get('/auth/users', authCtrl.listUsers);
router.post('/auth/switch-role', authCtrl.switchUser);
router.post('/auth/google', authCtrl.googleOAuthLogin);

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', dashboardCtrl.getDashboardStats);

// ==================== DEPARTMENTS ====================
router.get('/departments', academicCtrl.getDepartments);
router.post('/departments', academicCtrl.createDepartment);
router.put('/departments/:id', academicCtrl.updateDepartment);

// ==================== ACADEMIC YEARS & SEMESTERS ====================
router.get('/academic-years', academicCtrl.getAcademicYears);
router.get('/semesters', academicCtrl.getSemesters);

// ==================== DIVISIONS ====================
router.get('/divisions', academicCtrl.getDivisions);
router.post('/divisions', academicCtrl.createDivision);
router.put('/divisions/:id', academicCtrl.updateDivision);

// ==================== SUBJECTS ====================
router.get('/subjects', academicCtrl.getSubjects);
router.post('/subjects', academicCtrl.createSubject);

// ==================== FACULTY ====================
router.get('/faculty', academicCtrl.getFaculty);
router.post('/faculty', academicCtrl.createFaculty);
router.post('/faculty/:facultyId/subjects', academicCtrl.assignFacultySubjects);
router.get('/faculty/:facultyId/availability', academicCtrl.getFacultyAvailability);

// ==================== ROOMS ====================
router.get('/rooms', academicCtrl.getRooms);
router.post('/rooms', academicCtrl.createRoom);

// ==================== TIME SLOTS ====================
router.get('/time-slots', academicCtrl.getTimeSlots);

// ==================== AVAILABILITY ====================
router.post('/availability/faculty', academicCtrl.setFacultyAvailability);
router.post('/availability/division', academicCtrl.setDivisionAvailability);

// ==================== TIMETABLES ====================
router.post('/timetables/generate', timetableCtrl.generate);
router.get('/timetables', timetableCtrl.listTimetables);
router.get('/timetables/:id', timetableCtrl.getTimetableById);
router.post('/timetables/:id/move', timetableCtrl.moveTimetableEntry);
router.post('/timetables/:id/publish', timetableCtrl.publishTimetable);
router.post('/timetables/:id/archive', timetableCtrl.archiveTimetable);
router.delete('/timetables/:id', timetableCtrl.deleteTimetable);
router.get('/conflicts/:id', timetableCtrl.getConflicts);

export default router;
