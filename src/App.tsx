import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import HabitTracker from './pages/HabitTracker';
import Auth from './pages/Auth';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
          <header className="px-6 py-4 border-b border-surface-border bg-background sticky top-0 z-10 flex items-center justify-between">
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,1)]">🐝</span> BetterBee
            </div>
            <nav className="flex gap-6 text-sm font-medium text-slate-400">
              <Link to="/" className="hover:text-primary transition-colors text-white">Dashboard</Link>
              <Link to="/habits" className="hover:text-primary transition-colors hover:text-white">Habits</Link>
            </nav>
            <div>
              <Link to="/auth" className="text-sm font-medium border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-surface transition-colors">Sign In</Link>
            </div>
          </header>

          <main className="flex-1 max-w-6xl w-full mx-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/habits" element={<HabitTracker />} />
              <Route path="/auth" element={<Auth />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
