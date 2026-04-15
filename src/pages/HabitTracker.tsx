import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, Circle } from 'lucide-react';

export default function HabitTracker() {
  const { habits, toggleHabit, removeHabit, addHabitManual } = useAppContext();
  const [newHabit, setNewHabit] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    addHabitManual(newHabit);
    setNewHabit('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white">Habit Tracker</h1>
      <p className="text-slate-400">Track your daily commitments and AI-generated timetables to stay on target.</p>

      <div className="bg-surface border border-surface-border p-6 rounded-2xl shadow-sm max-w-xl">
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input 
            type="text" 
            className="flex-1 bg-[#020617] border border-surface-border rounded-lg p-3 text-sm text-white focus:border-primary focus:outline-none" 
            placeholder="Add a new habit..."
            value={newHabit}
            onChange={e => setNewHabit(e.target.value)}
          />
          <button type="submit" className="bg-primary text-surface py-2 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors">
            Add
          </button>
        </form>

        <div className="space-y-3">
          {habits.length === 0 && <p className="text-slate-500 text-sm">No habits yet. Generate a timetable or add one manually!</p>}
          {habits.map(habit => (
            <div key={habit.id} className="flex items-center justify-between p-3 border border-surface-border rounded-lg hover:border-slate-700 transition-colors bg-[#020617]">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => toggleHabit(habit.id)}
              >
                {habit.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-600" />
                )}
                <span className={habit.completed ? 'line-through text-slate-500' : 'text-slate-300 font-medium'}>
                  {habit.name}
                </span>
              </div>
              <button 
                onClick={() => removeHabit(habit.id)}
                className="text-xs text-red-500 hover:text-red-400 font-medium px-2 py-1"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
