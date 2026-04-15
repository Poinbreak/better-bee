import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Metrics = {
  height: number;
  weight: number;
  ethnicity: string;
  bodyFatPct: number;
};

type LongTermGoals = Macros & {
  targetBodyFatPct: number;
  targetWeight: number;
};

export type Habit = {
  id: number;
  name: string;
  completed: boolean;
};

interface AppContextType {
  consumed: Macros;
  burnedCalories: number;
  goals: LongTermGoals;
  metrics: Metrics;
  startingMetrics: Metrics | null;
  habits: Habit[];
  addConsumed: (macros: Partial<Macros>) => void;
  addBurned: (calories: number) => void;
  updateGoals: (newGoals: Partial<LongTermGoals>) => void;
  updateMetrics: (newMetrics: Partial<Metrics>) => void;
  setStartingMetrics: (metrics: Metrics) => void;
  appendHabits: (newHabits: string[]) => void;
  toggleHabit: (id: number) => void;
  removeHabit: (id: number) => void;
  addHabitManual: (name: string) => void;
  resetDaily: () => void;
}

const defaultMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
const defaultGoals = { calories: 2000, protein: 120, carbs: 200, fat: 60, targetBodyFatPct: 15, targetWeight: 65 };
const defaultMetrics = { height: 175, weight: 70, ethnicity: '', bodyFatPct: 0 };

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [consumed, setConsumed] = useState<Macros>(defaultMacros);
  const [burnedCalories, setBurnedCalories] = useState(0);
  const [goals, setGoals] = useState<LongTermGoals>(defaultGoals);
  const [metrics, setMetrics] = useState<Metrics>(defaultMetrics);
  const [startingMetrics, setStartingMetricsState] = useState<Metrics | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);

  const addConsumed = (macros: Partial<Macros>) => {
    setConsumed(prev => ({
      calories: prev.calories + (macros.calories || 0),
      protein: prev.protein + (macros.protein || 0),
      carbs: prev.carbs + (macros.carbs || 0),
      fat: prev.fat + (macros.fat || 0),
    }));
  };

  const addBurned = (cals: number) => setBurnedCalories(prev => prev + cals);
  const updateGoals = (newGoals: Partial<LongTermGoals>) => setGoals(prev => ({ ...prev, ...newGoals }));
  
  const updateMetrics = (newMetrics: Partial<Metrics>) => {
    setMetrics(prev => ({ ...prev, ...newMetrics }));
  };

  const setStartingMetrics = (metricsRaw: Metrics) => {
    setStartingMetricsState(metricsRaw);
  };

  const appendHabits = (newTasks: string[]) => {
    setHabits(prev => [
      ...prev,
      ...newTasks.map((name, idx) => ({ id: Date.now() + idx, name, completed: false }))
    ]);
  };

  const toggleHabit = (id: number) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  const removeHabit = (id: number) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const addHabitManual = (name: string) => {
    setHabits(prev => [...prev, { id: Date.now(), name, completed: false }]);
  };

  const resetDaily = () => {
    setConsumed(defaultMacros);
    setBurnedCalories(0);
    // Optionally reset habits to uncompleted
    setHabits(prev => prev.map(h => ({ ...h, completed: false })));
  };

  return (
    <AppContext.Provider value={{ 
      consumed, burnedCalories, goals, metrics, startingMetrics, habits, 
      addConsumed, addBurned, updateGoals, updateMetrics, setStartingMetrics,
      appendHabits, toggleHabit, removeHabit, addHabitManual, resetDaily 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
