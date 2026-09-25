import React from 'react';
import { useAppStore } from './store/useAppStore';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import TimetablesView from './pages/TimetablesView';
import Generator from './pages/Generator';
import ConflictDashboard from './pages/ConflictDashboard';
import AcademicResources from './pages/AcademicResources';
import AvailabilityManager from './pages/AvailabilityManager';

export default function App() {
  const { activeTab } = useAppStore();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'timetables':
        return <TimetablesView />;
      case 'generator':
        return <Generator />;
      case 'conflicts':
        return <ConflictDashboard />;
      case 'resources':
        return <AcademicResources />;
      case 'availability':
        return <AvailabilityManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <Navbar />
      
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
