import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { AssetDetails } from './pages/AssetDetails';
import { Alerts } from './pages/Alerts';
import { Maintenance } from './pages/Maintenance';
import { Technician } from './pages/Technician';
import { CsvUploadModal } from './components/CsvUploadModal';
import { User } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(4); // Default WT-004
  const [alertCount, setAlertCount] = useState<number>(0);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const [currentUser, setCurrentUser] = useState<User>({
    id: 1,
    name: 'Sarah Operator',
    email: 'operator@renewguard.io',
    role: 'operator',
  });

  // Periodically refresh active alert count
  const refreshAlertCount = async () => {
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
  }, []);

  const handleSelectAsset = (assetId: number) => {
    setSelectedAssetId(assetId);
    setCurrentTab('asset_details');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard key={refreshKey} onSelectAsset={handleSelectAsset} onNavigateTab={setCurrentTab} />
        )}

        {currentTab === 'assets' && (
          <Assets key={refreshKey} onSelectAsset={handleSelectAsset} />
        )}

        {currentTab === 'asset_details' && selectedAssetId && (
          <AssetDetails
            assetId={selectedAssetId}
            onBack={() => setCurrentTab('assets')}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'alerts' && (
          <Alerts onSelectAsset={handleSelectAsset} />
        )}

        {currentTab === 'maintenance' && (
          <Maintenance onSelectAsset={handleSelectAsset} />
        )}

        {currentTab === 'technician' && (
          <Technician />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        RenewGuard AI • HackOut'26 Predictive Maintenance Platform • Wind & Solar Asset Intelligence
      </footer>
    </div>
  );
};

export default App;
