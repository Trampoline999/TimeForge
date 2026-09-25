import { create } from 'zustand';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('timetable_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

const applyTheme = (theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useAppStore = create((set) => ({
  currentUser: null,
  activeTab: 'dashboard',
  selectedTimetableId: null,
  activeDepartmentId: null,
  activeSemesterId: null,
  isSidebarOpen: true,
  theme: initialTheme,

  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedTimetableId: (id) => set({ selectedTimetableId: id }),
  setActiveDepartmentId: (deptId) => set({ activeDepartmentId: deptId }),
  setActiveSemesterId: (semId) => set({ activeSemesterId: semId }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setTheme: (theme) => {
    localStorage.setItem('timetable_theme', theme);
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('timetable_theme', nextTheme);
      applyTheme(nextTheme);
      return { theme: nextTheme };
    });
  },
}));
