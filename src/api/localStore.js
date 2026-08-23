import { subDays, format, isSameDay, parseISO, compareDesc } from 'date-fns';

const STORAGE_KEY = 'habitflow_data_v1';

// Helper to load data
const loadData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : getInitialData();
  } catch (e) {
    console.error("Failed to load data", e);
    return getInitialData();
  }
};

// Helper to save data
const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

const getInitialData = () => ({
  tasks: [],
  habits: [],
  projects: [
    { id: 'proj_1', name: 'Website Redesign', color: '#8B5CF6' },
    { id: 'proj_2', name: 'Mobile App', color: '#3B82F6' }
  ],
  moodHistory: [],
  userPreferences: [],
  user: {
    id: 'local_user',
    full_name: 'Local User',
    email: 'user@local.app'
  }
});

// Helper to calculate streaks
const calculateStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) return 0;

  // Sort dates descending (newest first)
  const sortedDates = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // If the most recent completion isn't today or yesterday, streak is broken (unless it's a brand new habit? No, 0 is correct)
  // Actually, we iterate and check continuity.
  
  // Convert strings to timestamp for easier comparison
  const uniqueDates = Array.from(new Set(sortedDates)); // Remove duplicates just in case
  
  if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date();
  
  // If today is not completed, start checking from yesterday
  if (!uniqueDates.includes(format(currentDate, 'yyyy-MM-dd'))) {
    currentDate = subDays(currentDate, 1);
  }

  while (true) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    if (uniqueDates.includes(dateStr)) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }
  return streak;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const localStore = {
  auth: {
    me: async () => {
      await delay(100);
      return loadData().user;
    },
    logout: async () => {
      await delay(100);
      console.log("Logged out (mock)");
      // In a real app, this would clear tokens. Here we just reload or do nothing.
      window.location.href = '/';
    }
  },
  entities: {
    Task: {
      list: async (sort) => {
        await delay(200);
        const data = loadData();
        let tasks = [...data.tasks];
        if (sort === '-created_date') {
          tasks.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        }
        return tasks;
      },
      create: async (taskData) => {
        await delay(200);
        const data = loadData();
        const newTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_date: new Date().toISOString(),
          ...taskData
        };
        data.tasks.push(newTask);
        saveData(data);
        return newTask;
      },
      update: async (id, updates) => {
        await delay(200);
        const data = loadData();
        const index = data.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
          data.tasks[index] = { ...data.tasks[index], ...updates };
          saveData(data);
          return data.tasks[index];
        }
        throw new Error("Task not found");
      },
      delete: async (id) => {
        await delay(200);
        const data = loadData();
        data.tasks = data.tasks.filter(t => t.id !== id);
        saveData(data);
        return id;
      }
    },
    Habit: {
      list: async () => {
        await delay(200);
        const data = loadData();
        // Recalculate streaks on read to ensure they are up to date with "time passing"
        const habitsWithRecalculatedStreaks = data.habits.map(h => ({
          ...h,
          streak: calculateStreak(h.completed_dates)
        }));
        return habitsWithRecalculatedStreaks;
      },
      create: async (habitData) => {
        await delay(200);
        const data = loadData();
        const newHabit = {
          id: `habit_${Date.now()}`,
          streak: 0,
          completed_dates: [],
          ...habitData
        };
        data.habits.push(newHabit);
        saveData(data);
        return newHabit;
      },
      update: async (id, updates) => {
        await delay(200);
        const data = loadData();
        const index = data.habits.findIndex(h => h.id === id);
        if (index !== -1) {
          // Apply updates
          const updatedHabit = { ...data.habits[index], ...updates };
          
          // If completed_dates changed, recalculate streak
          if (updates.completed_dates) {
            updatedHabit.streak = calculateStreak(updates.completed_dates);
          }
          
          data.habits[index] = updatedHabit;
          saveData(data);
          return updatedHabit;
        }
        throw new Error("Habit not found");
      },
      delete: async (id) => {
        await delay(200);
        const data = loadData();
        data.habits = data.habits.filter(h => h.id !== id);
        saveData(data);
        return id;
      }
    },
    Project: {
      list: async () => {
        await delay(100);
        return loadData().projects;
      }
    },
    Mood: {
      list: async () => {
        await delay(200);
        return loadData().moodHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      },
      create: async (entryData) => {
        await delay(200);
        const data = loadData();
        const newEntry = {
          id: `mood_${Date.now()}`,
          date: new Date().toISOString(),
          ...entryData
        };
        data.moodHistory.push(newEntry);
        saveData(data);
        return newEntry;
      }
    },
    UserPreferences: {
        filter: async (query) => {
            await delay(200);
            const data = loadData();
            // Simple mock filter
            return data.userPreferences.filter(p => {
                for (let key in query) {
                    if (p[key] !== query[key]) return false;
                }
                return true;
            });
        },
        create: async (prefData) => {
            await delay(200);
            const data = loadData();
            const newPref = {
                id: `pref_${Date.now()}`,
                ...prefData
            };
            data.userPreferences.push(newPref);
            saveData(data);
            return newPref;
        },
        update: async (id, updates) => {
            await delay(200);
            const data = loadData();
            const index = data.userPreferences.findIndex(p => p.id === id);
            if (index !== -1) {
                data.userPreferences[index] = { ...data.userPreferences[index], ...updates };
                saveData(data);
                return data.userPreferences[index];
            }
            throw new Error("Preferences not found");
        }
    }
  }
};
