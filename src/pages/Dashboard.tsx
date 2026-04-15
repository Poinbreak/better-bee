import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { analyzeFoodJSON, analyzeBodyFatJSON, analyzeExerciseJSON, generateTimetableJSON } from '../lib/gemini';
import { UploadCloud, Loader2, Utensils, Target, Activity, CalendarDays } from 'lucide-react';

function ProgressBar({ label, current, max, colorClass }: { label: string, current: number, max: number, colorClass: string }) {
  const pct = Math.min((current / max) * 100, 100) || 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-medium text-slate-400">
        <span>{label}</span>
        <span>{current} / {max}</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function JourneyProgressBar({ label, start, current, goal, colorClass }: { label: string, start: number, current: number, goal: number, colorClass: string }) {
  // Calculate percentage of journey completed
  const totalJourney = Math.abs(start - goal);
  const currentProgress = Math.abs(start - current);
  const pct = totalJourney === 0 ? 100 : Math.min((currentProgress / totalJourney) * 100, 100);
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-medium text-slate-400">
        <span>{label}</span>
        <span>Start: {start} | Goal: {goal}</span>
      </div>
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
          {pct.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}


export default function Dashboard() {
  const { consumed, burnedCalories, goals, metrics, startingMetrics, setStartingMetrics, updateGoals, updateMetrics, addConsumed, addBurned, resetDaily, appendHabits } = useAppContext();

  const [foodText, setFoodText] = useState('');
  const [foodFile, setFoodFile] = useState<File | null>(null);
  const foodInputRef = useRef<HTMLInputElement>(null);
  const [loadingFood, setLoadingFood] = useState(false);

  const [exerciseText, setExerciseText] = useState('');
  const [manualExerciseCals, setManualExerciseCals] = useState('');
  const [loadingExercise, setLoadingExercise] = useState(false);

  const [metricHeight, setMetricHeight] = useState(metrics.height);
  const [metricWeight, setMetricWeight] = useState(metrics.weight);
  const [metricEthnicity, setMetricEthnicity] = useState(metrics.ethnicity);
  const [metricFile, setMetricFile] = useState<File | null>(null);
  const metricInputRef = useRef<HTMLInputElement>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const [editMetrics, setEditMetrics] = useState(startingMetrics === null);

  // Handlers
  const handleFoodSubmit = async () => {
    if (!foodText && !foodFile) return alert("Describe food or add a photo!");
    setLoadingFood(true);
    try {
      const result = await analyzeFoodJSON(foodText, foodFile || undefined);
      addConsumed({ calories: result.calories, protein: result.protein, carbs: result.carbs, fat: result.fat });
      setFoodText('');
      setFoodFile(null);
      alert(`Added ${result.calories} kcal!`);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoadingFood(false);
    }
  };

  const handleExerciseSubmit = async () => {
    if (manualExerciseCals) {
      addBurned(Number(manualExerciseCals));
      setManualExerciseCals('');
      alert(`Burned ${manualExerciseCals} kcal added!`);
      return;
    }
    if (!exerciseText) return alert("Describe exercise or enter cals directly!");
    setLoadingExercise(true);
    try {
      const result = await analyzeExerciseJSON(exerciseText);
      addBurned(result.caloriesBurned);
      setExerciseText('');
      alert(`Burned ${result.caloriesBurned} kcal added via AI!`);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoadingExercise(false);
    }
  };

  const handleMetricsSubmit = async () => {
    if (!metricHeight || !metricWeight) return alert("Height and weight required.");
    setLoadingMetrics(true);
    try {
      updateMetrics({ height: metricHeight, weight: metricWeight, ethnicity: metricEthnicity });
      const result = await analyzeBodyFatJSON({ height: metricHeight, weight: metricWeight, ethnicity: metricEthnicity }, metricFile || undefined);
      
      const newMetrics = { height: metricHeight, weight: metricWeight, ethnicity: metricEthnicity, bodyFatPct: result.bodyFatPct };
      updateMetrics({ bodyFatPct: result.bodyFatPct });
      updateGoals({ calories: result.targetCalories, protein: result.targetProtein, carbs: result.targetCarbs, fat: result.targetFat, targetBodyFatPct: result.bodyFatPct });

      // Save as starting metrics if none exist
      if (!startingMetrics) {
        setStartingMetrics(newMetrics);
      }
      setEditMetrics(false);
      alert('Metrics calibrated & Goals updated!');
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleGenerateTimetable = async () => {
    setLoadingTimetable(true);
    try {
      const result = await generateTimetableJSON(metrics, goals);
      if (result.tasks && result.tasks.length > 0) {
        appendHabits(result.tasks);
        alert('Timetable generated and appended to Habits!');
      } else {
        alert('Failed to generate timetable tasks.');
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const netCalories = consumed.calories - burnedCalories;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Master Voyage Progress (Only visible if starting metrics exist) */}
      {startingMetrics && (
        <section className="bg-surface border border-surface-border p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Target className="text-purple-400" /> Ultimate Journey Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <JourneyProgressBar 
              label="Weight Journey (kg)" 
              start={startingMetrics.weight} 
              current={metrics.weight} 
              goal={goals.targetWeight} 
              colorClass="bg-gradient-to-r from-blue-600 to-cyan-400 border-r-2 border-white"
            />
            {startingMetrics.bodyFatPct > 0 && goals.targetBodyFatPct > 0 && (
              <JourneyProgressBar 
                label="Body Fat Journey (%)" 
                start={startingMetrics.bodyFatPct} 
                current={metrics.bodyFatPct} 
                goal={goals.targetBodyFatPct} 
                colorClass="bg-gradient-to-r from-red-600 to-orange-400 border-r-2 border-white"
              />
            )}
          </div>
        </section>
      )}


      {/* Top Banner & Daily Progress Bars */}
      <section className="bg-surface border border-surface-border p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between mb-2 border-b border-surface-border pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Daily Progress</h2>
              <p className="text-sm text-slate-400">Net Calories: <span className="font-bold text-white">{netCalories}</span> / {goals.calories} kcal</p>
            </div>
            <button onClick={resetDaily} className="text-xs text-red-400 border border-red-900/30 px-3 py-1.5 rounded hover:bg-red-900/20 transition">Reset Day</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ProgressBar label="Calories" current={netCalories} max={goals.calories} colorClass="bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            <ProgressBar label="Protein (g)" current={consumed.protein} max={goals.protein} colorClass="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <ProgressBar label="Carbs (g)" current={consumed.carbs} max={goals.carbs} colorClass="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <ProgressBar label="Fat (g)" current={consumed.fat} max={goals.fat} colorClass="bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          </div>
        </div>
      </section>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Food Logger */}
        <div className="bg-surface border border-surface-border p-6 rounded-2xl shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-surface-border pb-2">
            <Utensils className="w-5 h-5 text-primary" /> Log Food
          </div>
          <textarea 
            className="w-full bg-[#020617] border border-surface-border rounded-lg p-3 text-sm text-white focus:border-primary focus:outline-none"
            rows={3} placeholder="Describe food (e.g. 1 bowl rice, 2 eggs)" value={foodText} onChange={e => setFoodText(e.target.value)}
          />
          <div 
            className="border border-dashed border-surface-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors text-slate-400 hover:text-primary"
            onClick={() => foodInputRef.current?.click()}
          >
            <p className="text-xs flex items-center justify-center gap-2">
              <UploadCloud className="w-4 h-4" /> {foodFile ? foodFile.name : 'Upload Photo'}
            </p>
            <input type="file" accept="image/*" className="hidden" ref={foodInputRef} onChange={e => setFoodFile(e.target.files?.[0] || null)} />
          </div>
          <button onClick={handleFoodSubmit} disabled={loadingFood} className="bg-primary text-surface py-2 rounded-lg font-medium hover:bg-primary-hover flex items-center justify-center gap-2 disabled:opacity-50">
            {loadingFood ? <Loader2 className="animate-spin w-4 h-4" /> : 'Log Macros'}
          </button>
        </div>

        {/* Exercise Tracker */}
        <div className="bg-surface border border-surface-border p-6 rounded-2xl shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-surface-border pb-2">
            <Activity className="w-5 h-5 text-blue-500" /> Track Exercise
          </div>
          <input 
            type="number" 
            className="w-full bg-[#020617] border border-surface-border rounded-lg p-3 text-sm text-white focus:border-primary focus:outline-none"
            placeholder="Manual calories burned (kcal)" value={manualExerciseCals} onChange={e => setManualExerciseCals(e.target.value)}
          />
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-surface-border"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">OR AI Estimate</span>
            <div className="flex-grow border-t border-surface-border"></div>
          </div>
          <textarea 
            className="w-full bg-[#020617] border border-surface-border rounded-lg p-3 text-sm text-white focus:border-primary focus:outline-none"
            rows={2} placeholder="E.g., ran 5km in 30 mins" value={exerciseText} onChange={e => setExerciseText(e.target.value)}
          />
          <button onClick={handleExerciseSubmit} disabled={loadingExercise} className="border border-blue-500 text-blue-400 py-2 rounded-lg font-medium hover:bg-blue-500 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
            {loadingExercise ? <Loader2 className="animate-spin w-4 h-4" /> : 'Log Workout'}
          </button>
        </div>

        {/* Body Metrics & AI Goals */}
        <div className="bg-surface border border-surface-border p-6 rounded-2xl shadow-lg flex flex-col gap-4 relative">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
             <div className="flex items-center gap-2 text-white font-semibold flex-1">
              <Target className="w-5 h-5 text-purple-500" /> Body Metrics
             </div>
             {!editMetrics && startingMetrics && (
               <button onClick={() => setEditMetrics(true)} className="text-xs text-purple-400 hover:text-purple-300">Recalibrate</button>
             )}
          </div>

          {!editMetrics && startingMetrics ? (
            <div className="flex flex-col gap-4 py-2">
              <div className="bg-[#020617] p-4 rounded-lg border border-surface-border space-y-2">
                <p className="text-sm font-semibold text-slate-300 border-b border-surface-border pb-1">Starting Info</p>
                <div className="flex justify-between text-sm text-slate-400"><span>Weight:</span> <span className="text-white font-medium">{startingMetrics.weight} kg</span></div>
                <div className="flex justify-between text-sm text-slate-400"><span>Height:</span> <span className="text-white font-medium">{startingMetrics.height} cm</span></div>
                <div className="flex justify-between text-sm text-slate-400"><span>Est. BF%:</span> <span className="text-white font-medium">{startingMetrics.bodyFatPct}%</span></div>
              </div>
              
              <button onClick={handleGenerateTimetable} disabled={loadingTimetable} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(147,51,234,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 transition-all mt-auto">
                {loadingTimetable ? <Loader2 className="animate-spin w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
                {loadingTimetable ? 'Generating Plan...' : 'Generate Action Timeline'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Height (cm)" className="bg-[#020617] border border-surface-border rounded-lg p-2 text-sm text-white focus:border-primary" value={metricHeight} onChange={e => setMetricHeight(Number(e.target.value))} />
                <input type="number" placeholder="Weight (kg)" className="bg-[#020617] border border-surface-border rounded-lg p-2 text-sm text-white focus:border-primary" value={metricWeight} onChange={e => setMetricWeight(Number(e.target.value))} />
              </div>
              <select className="bg-[#020617] border border-surface-border rounded-lg p-2 text-sm text-slate-400 focus:border-primary" value={metricEthnicity} onChange={e => setMetricEthnicity(e.target.value)}>
                <option value="">Ethnicity...</option>
                <option value="asian">Asian</option>
                <option value="caucasian">Caucasian</option>
                <option value="hispanic">Hispanic/Latino</option>
                <option value="african">African/Black</option>
                <option value="other">Other</option>
              </select>
              <div 
                className="border border-dashed border-surface-border rounded-lg p-2 text-center cursor-pointer hover:border-purple-500 transition-colors text-slate-400 hover:text-purple-400"
                onClick={() => metricInputRef.current?.click()}
              >
                <p className="text-xs flex items-center justify-center gap-2">
                  <UploadCloud className="w-4 h-4" /> {metricFile ? metricFile.name : 'Body Photo (Optional)'}
                </p>
                <input type="file" accept="image/*" className="hidden" ref={metricInputRef} onChange={e => setMetricFile(e.target.files?.[0] || null)} />
              </div>
              <button onClick={handleMetricsSubmit} disabled={loadingMetrics} className="border border-purple-500 text-purple-400 py-2 rounded-lg font-medium hover:bg-purple-500 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                {loadingMetrics ? <Loader2 className="animate-spin w-4 h-4" /> : (startingMetrics ? 'Update Metrics' : 'Initialize Target Goals')}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
