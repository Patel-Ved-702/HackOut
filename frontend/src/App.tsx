import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { AssetDetails } from './pages/AssetDetails';
import { Alerts } from './pages/Alerts';
import { Maintenance } from './pages/Maintenance';
import { Technician } from './pages/Technician';
import { SuperAdmin } from './pages/SuperAdmin';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CsvUploadModal } from './components/CsvUploadModal';
import { User } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [alertCount, setAlertCount] = useState<number>(0);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  // Check auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('auth_token')
  );

  const [currentUser, setCurrentUser] = useState<User>({
    id: 1,
    name: 'Sarah Operator',
    email: 'operator@renewguard.io',
    role: 'operator',
  });

  const navigate = useNavigate();

  // Periodically refresh active alert count (only if authenticated)
  const refreshAlertCount = async () => {
    if (!isAuthenticated) return;
    try {
      const alerts = await api.getAlerts('active');
      setAlertCount(alerts.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshAlertCount();
    const interval = setInterval(refreshAlertCount, 6000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    navigate('/');
  };

  // If not authenticated, render public routes
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // If authenticated, render application structure
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        alertCount={alertCount}
        onOpenUploadCsv={() => setIsCsvModalOpen(true)}
      />

      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          refreshAlertCount();
          setRefreshKey((k) => k + 1);
        }}
      />

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Dashboard key={refreshKey} />} />
          <Route path="/assets" element={<Assets key={refreshKey} />} />
          <Route path="/assets/:id" element={<AssetDetails />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/technician" element={<Technician />} />
          
          {/* Protected Super Admin Route */}
          {currentUser.role === 'superadmin' && (
            <Route path="/superadmin" element={<SuperAdmin />} />
          )}

          {/* Catch-all for authenticated users */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 flex items-center justify-center gap-4 text-xs text-slate-500">
        <span>RenewGuard AI • Predictive Maintenance Platform</span>
        <button 
          onClick={handleLogout}
          className="text-slate-400 hover:text-rose-500 font-medium transition-colors"
        >
          Sign Out
        </button>
      </footer>
    </div>
  );
};

export default App;
