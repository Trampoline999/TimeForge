import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  Layers, 
  School,
  Building2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Sidebar() {
  const { activeTab, setActiveTab, currentUser } = useAppStore();

  const navItems = [
    {
      id: 'dashboard',
      label: 'College Overview',
      icon: LayoutDashboard,
      description: 'Key metrics & schedules',
    },
    {
      id: 'timetables',
      label: 'Timetable Matrix',
      icon: CalendarDays,
      description: 'Division, Faculty & Room grids',
    },
    {
      id: 'generator',
      label: 'AI Generator',
      icon: Sparkles,
      description: 'Automated constraint solver',
      highlight: true,
      roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'],
    },
    {
      id: 'conflicts',
      label: 'Conflict Center',
      icon: AlertTriangle,
      description: 'Hard & soft issue analysis',
    },
    {
      id: 'resources',
      label: 'Academic Resources',
      icon: Building2,
      description: 'Faculty, Rooms, Subjects & Divs',
    },
    {
      id: 'availability',
      label: 'Availability Grid',
      icon: Clock,
      description: 'Faculty & Division periods',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card/30 p-4 hidden md:flex md:flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              if (item.roles && currentUser && !item.roles.includes(currentUser.role)) {
                return null;
              }

              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <div className="overflow-hidden">
                    <div className="truncate font-medium">{item.label}</div>
                    <div className={`truncate text-[11px] ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <Separator />

        {/* Academic Session Card */}
        <Card className="bg-card/60 border-border shadow-none">
          <CardHeader className="p-3.5 pb-2">
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-semibold">Academic Session</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">2026-27</span>
              <Badge variant="success" className="text-[10px] px-1.5 py-0">ACTIVE</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Odd Semesters (1, 3, 5, 7)</p>
          </CardContent>
        </Card>
      </div>

      {/* Shared Resource Status */}
      <Card className="bg-muted/40 border-border/80 shadow-none">
        <CardContent className="p-3.5">
          <div className="flex items-center gap-2 text-primary font-medium text-xs">
            <Layers className="h-3.5 w-3.5" />
            <span>Shared Synchronized Engine</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            Faculty & Lab availability is synchronized across all engineering branches.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}
