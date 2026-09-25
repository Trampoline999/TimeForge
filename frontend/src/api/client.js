const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('timetable_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  getCurrentUser: () => apiRequest('/auth/me'),
  getUsers: () => apiRequest('/auth/users'),
  switchUser: (userId) => apiRequest('/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId }) }),
  googleLogin: (payload) => apiRequest('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),

  // Dashboard
  getDashboardStats: () => apiRequest('/dashboard/stats'),

  // Academic Master Data
  getDepartments: () => apiRequest('/departments'),
  createDepartment: (body) => apiRequest('/departments', { method: 'POST', body: JSON.stringify(body) }),
  getAcademicYears: () => apiRequest('/academic-years'),
  getSemesters: (academicYearId) => apiRequest(`/semesters${academicYearId ? `?academicYearId=${academicYearId}` : ''}`),
  getDivisions: (query = '') => apiRequest(`/divisions${query}`),
  createDivision: (body) => apiRequest('/divisions', { method: 'POST', body: JSON.stringify(body) }),
  getSubjects: (query = '') => apiRequest(`/subjects${query}`),
  createSubject: (body) => apiRequest('/subjects', { method: 'POST', body: JSON.stringify(body) }),
  getFaculty: (query = '') => apiRequest(`/faculty${query}`),
  createFaculty: (body) => apiRequest('/faculty', { method: 'POST', body: JSON.stringify(body) }),
  assignFacultySubjects: (facultyId, subjectIds) => apiRequest(`/faculty/${facultyId}/subjects`, { method: 'POST', body: JSON.stringify({ subjectIds }) }),
  getRooms: (query = '') => apiRequest(`/rooms${query}`),
  createRoom: (body) => apiRequest('/rooms', { method: 'POST', body: JSON.stringify(body) }),
  getTimeSlots: () => apiRequest('/time-slots'),

  // Availability
  getFacultyAvailability: (facultyId) => apiRequest(`/faculty/${facultyId}/availability`),
  setFacultyAvailability: (body) => apiRequest('/availability/faculty', { method: 'POST', body: JSON.stringify(body) }),
  setDivisionAvailability: (body) => apiRequest('/availability/division', { method: 'POST', body: JSON.stringify(body) }),

  // Timetables
  generateTimetable: (body) => apiRequest('/timetables/generate', { method: 'POST', body: JSON.stringify(body) }),
  getTimetables: () => apiRequest('/timetables'),
  getTimetable: (id) => apiRequest(`/timetables/${id}`),
  moveEntry: (timetableId, body) => apiRequest(`/timetables/${timetableId}/move`, { method: 'POST', body: JSON.stringify(body) }),
  publishTimetable: (id) => apiRequest(`/timetables/${id}/publish`, { method: 'POST' }),
  archiveTimetable: (id) => apiRequest(`/timetables/${id}/archive`, { method: 'POST' }),
  deleteTimetable: (id) => apiRequest(`/timetables/${id}`, { method: 'DELETE' }),
  getConflicts: (id) => apiRequest(`/conflicts/${id}`),
};
