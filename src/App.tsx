import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Budget } from './pages/Budget';
import { Analytics } from './pages/Analytics';
import { Goals } from './pages/Goals';
import { Settings } from './pages/Settings';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('overview');
  
  // Track globally selected month (e.g. August 2026 default to match screenshot)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        {/* Modern premium loader */}
        <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-white shadow-md animate-pulse">
          <svg className="w-6 h-6 fill-current animate-spin" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
          </svg>
        </div>
        <p className="text-xs font-semibold text-slate-400 animate-pulse tracking-wide font-sans">Syncing financial journals...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return (
          <Dashboard 
            setCurrentPage={setCurrentPage} 
            selectedMonth={selectedMonth} 
            setSelectedMonth={setSelectedMonth} 
          />
        );
      case 'expenses':
        return (
          <Expenses 
            selectedMonth={selectedMonth} 
            setSelectedMonth={setSelectedMonth} 
          />
        );
      case 'budget':
        return <Budget selectedMonth={selectedMonth} />;
      case 'analytics':
        return <Analytics selectedMonth={selectedMonth} />;
      case 'goals':
        return <Goals />;
      case 'settings':
        return <Settings selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />;
      default:
        return (
          <Dashboard 
            setCurrentPage={setCurrentPage} 
            selectedMonth={selectedMonth} 
            setSelectedMonth={setSelectedMonth} 
          />
        );
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
