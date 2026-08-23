import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/api/localStore';
import {
  Settings as SettingsIcon, Moon, Sun, Bell, Clock,
  Palette, Timer, LogOut, User, ChevronRight, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const u = await localStore.auth.me();
      setUser(u);
    };
    loadUser();

    // Check system dark mode
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const prefs = await localStore.entities.UserPreferences.filter({ user_email: user?.email });
      return prefs[0] || null;
    },
    enabled: !!user
  });

  const [settings, setSettings] = useState({
    notification_enabled: true,
    reminder_default_minutes: 30,
    work_hours_start: '09:00',
    work_hours_end: '17:00',
    default_view: 'dashboard',
    pomodoro_work_minutes: 25,
    pomodoro_break_minutes: 5
  });

  useEffect(() => {
    if (preferences) {
      setSettings(prev => ({
        ...prev,
        ...preferences
      }));
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return localStore.entities.UserPreferences.update(preferences.id, data);
      } else {
        return localStore.entities.UserPreferences.create({ ...data, user_email: user?.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleLogout = () => {
    localStore.auth.logout();
  };

  const sections = [
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          label: 'Dark Mode',
          description: 'Use dark theme',
          component: (
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          )
        },
        {
          label: 'Default View',
          description: 'Page to show on startup',
          component: (
            <Select 
              value={settings.default_view} 
              onValueChange={(v) => setSettings(prev => ({ ...prev, default_view: v }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
              </SelectContent>
            </Select>
          )
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Enable Notifications',
          description: 'Receive task reminders',
          component: (
            <Switch 
              checked={settings.notification_enabled} 
              onCheckedChange={(v) => setSettings(prev => ({ ...prev, notification_enabled: v }))}
            />
          )
        },
        {
          label: 'Default Reminder',
          description: 'Minutes before due time',
          component: (
            <Select 
              value={String(settings.reminder_default_minutes)} 
              onValueChange={(v) => setSettings(prev => ({ ...prev, reminder_default_minutes: parseInt(v) }))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          )
        }
      ]
    },
    {
      title: 'Work Schedule',
      icon: Clock,
      items: [
        {
          label: 'Work Hours Start',
          component: (
            <Input
              type="time"
              value={settings.work_hours_start}
              onChange={(e) => setSettings(prev => ({ ...prev, work_hours_start: e.target.value }))}
              className="w-28"
            />
          )
        },
        {
          label: 'Work Hours End',
          component: (
            <Input
              type="time"
              value={settings.work_hours_end}
              onChange={(e) => setSettings(prev => ({ ...prev, work_hours_end: e.target.value }))}
              className="w-28"
            />
          )
        }
      ]
    },
    {
      title: 'Pomodoro Timer',
      icon: Timer,
      items: [
        {
          label: 'Work Duration',
          description: 'Minutes per focus session',
          component: (
            <Select 
              value={String(settings.pomodoro_work_minutes)} 
              onValueChange={(v) => setSettings(prev => ({ ...prev, pomodoro_work_minutes: parseInt(v) }))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="25">25 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          )
        },
        {
          label: 'Break Duration',
          description: 'Minutes per break',
          component: (
            <Select 
              value={String(settings.pomodoro_break_minutes)} 
              onValueChange={(v) => setSettings(prev => ({ ...prev, pomodoro_break_minutes: parseInt(v) }))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 min</SelectItem>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="10">10 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
              </SelectContent>
            </Select>
          )
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-24">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-violet-500" />
            Settings
          </h1>
          <Button 
            onClick={handleSave}
            className={cn(
              "transition-all",
              saved 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-violet-500 hover:bg-violet-600"
            )}
            disabled={saveMutation.isPending}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-1" /> Saved
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile card */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  {user.full_name || 'User'}
                </h2>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5 text-slate-400" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Settings sections */}
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b dark:border-slate-700">
              <section.icon className="w-5 h-5 text-violet-500" />
              <h3 className="font-semibold text-slate-700 dark:text-white">{section.title}</h3>
            </div>
            <div className="divide-y dark:divide-slate-700">
              {section.items.map((item, j) => (
                <div key={j} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                    {item.description && (
                      <p className="text-sm text-slate-500">{item.description}</p>
                    )}
                  </div>
                  {item.component}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden"
        >
          <div className="p-4 border-b dark:border-slate-700">
            <h3 className="font-semibold text-slate-700 dark:text-white">Account</h3>
          </div>
          <div className="p-4">
            <Button 
              variant="outline" 
              className="w-full text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}