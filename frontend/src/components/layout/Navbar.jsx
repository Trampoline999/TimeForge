import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api/client';
import { Calendar, UserCheck, Shield, Sparkles, LogIn, ChevronDown, Check, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Navbar() {
  const { currentUser, setCurrentUser, setActiveTab } = useAppStore();
  const [usersList, setUsersList] = useState([]);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Fetch available user accounts for quick role-switching
    api.getUsers().then(res => {
      setUsersList(res.users || []);
    }).catch(console.error);

    // Fetch initial user
    api.getCurrentUser().then(res => {
      if (res.user) setCurrentUser(res.user);
    }).catch(console.error);
  }, [setCurrentUser]);

  const handleSwitchUser = async (user) => {
    try {
      const res = await api.switchUser(user.id);
      if (res.token) localStorage.setItem('timetable_token', res.token);
      setCurrentUser(res.user);
    } catch (e) {
      console.error('Failed to switch user:', e);
    }
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await api.googleLogin({
        email: googleEmail,
        name: googleName,
        collegeDomain: 'college.edu',
      });
      if (res.token) localStorage.setItem('timetable_token', res.token);
      setCurrentUser(res.user);
      setIsGoogleModalOpen(false);
      setGoogleEmail('');
      setGoogleName('');
    } catch (err) {
      setAuthError(err.message || 'Google Authentication failed');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="secondary" className="font-medium text-[11px] text-primary bg-primary/10 border-0">Admin</Badge>;
      case 'DEPARTMENT_ADMIN':
        return <Badge variant="secondary" className="font-medium text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border-0">HOD</Badge>;
      case 'FACULTY':
        return <Badge variant="secondary" className="font-medium text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-0">Faculty</Badge>;
      case 'STUDENT':
        return <Badge variant="secondary" className="font-medium text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-0">Student</Badge>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1560px] items-center justify-between px-4 sm:px-6">
        
        {/* Minimal Clean Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group select-none" 
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:opacity-90 transition-opacity">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-semibold tracking-tight text-foreground">
              TimeForge
            </span>
            <span className="text-[11px] text-muted-foreground/80 font-normal hidden sm:inline">
              / Timetable
            </span>
          </div>
        </div>

        {/* Right Actions: Generator Trigger, Theme Toggle & User / Role Switcher */}
        <div className="flex items-center gap-2">
          {currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'DEPARTMENT_ADMIN') && (
            <Button
              onClick={() => setActiveTab('generator')}
              size="sm"
              className="gap-1.5 h-8 text-xs font-medium shadow-none"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Timetable</span>
            </Button>
          )}

          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* User Role Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 hover:bg-accent/60">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[11px] font-semibold bg-muted text-foreground">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <span className="text-xs font-medium leading-none block">{currentUser?.name || 'Guest'}</span>
                </div>
                {currentUser && (
                  <span className="hidden lg:inline-block">
                    {getRoleBadge(currentUser.role)}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 opacity-50 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-foreground">Active User</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser?.email || 'guest@college.edu'}</p>
                  <div className="pt-1">{currentUser && getRoleBadge(currentUser.role)}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-semibold">
                Switch Role / Persona
              </DropdownMenuLabel>
              {usersList.map((u) => {
                const isSelected = currentUser?.id === u.id;
                return (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => handleSwitchUser(u)}
                    className="flex items-center justify-between py-2 cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium leading-none">{u.name}</span>
                      <span className="text-[10px] text-muted-foreground">{u.email}</span>
                      <div className="pt-0.5">{getRoleBadge(u.role)}</div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsGoogleModalOpen(true)}
                className="cursor-pointer gap-2 text-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Simulate Google Single Sign-On</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Google SSO Dialog */}
      <Dialog open={isGoogleModalOpen} onOpenChange={setIsGoogleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Google College SSO Simulation</DialogTitle>
            <DialogDescription>
              Sign in with institutional Google credentials under @college.edu.
            </DialogDescription>
          </DialogHeader>

          {authError && (
            <Alert variant="destructive">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleGoogleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="googleName">Full Name</Label>
              <Input
                id="googleName"
                placeholder="Dr. Alan Turing"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleEmail">Institutional Email (@college.edu)</Label>
              <Input
                id="googleEmail"
                type="email"
                placeholder="alan.turing@college.edu"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsGoogleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Sign In with Google</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
