import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  Building2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Sidebar() {
  const { activeTab, setActiveTab, currentUser } = useAppStore();

  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'timetables',
      label: 'Timetable Matrix',
      icon: CalendarDays,
    },
    {
      id: 'generator',
      label: 'Generator',
      icon: Sparkles,
      badge: 'Auto',
      roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'],
    },
    {
      id: 'conflicts',
      label: 'Conflict Audit',
      icon: AlertTriangle,
    },
  ];

  const resourceNavItems = [
    {
      id: 'resources',
      label: 'Academic Data',
      icon: Building2,
    },
    {
      id: 'availability',
      label: 'Availability',
      icon: Clock,
    },
  ];

  const renderNavList = (items) => (
    <nav className="space-y-0.5">
      {items.map((item) => {
        if (item.roles && currentUser && !item.roles.includes(currentUser.role)) {
          return null;
        }

        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`group w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-all cursor-pointer ${
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <Badge variant="outline" className={`text-[10px] h-4 px-1.5 py-0 font-normal border-0 ${
                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {item.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <aside className="w-56 shrink-0 border-r border-border/80 bg-background/50 p-3.5 hidden md:flex md:flex-col justify-between min-h-[calc(100vh-3.5rem)] select-none">
      <div className="space-y-5">
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </p>
          {renderNavList(mainNavItems)}
        </div>

        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Resources
          </p>
          {renderNavList(resourceNavItems)}
        </div>
      </div>

      {/* Minimal Session Status Pill */}
      <div className="pt-4 border-t border-border/60">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/40 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-foreground">2026-27</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Odd Sem</span>
        </div>
      </div>
    </aside>
  );
}
