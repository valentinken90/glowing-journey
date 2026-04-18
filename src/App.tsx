import { useState, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import LogStars from './components/LogStars';
import Rewards from './components/Rewards';
import History from './components/History';
import Toast from './components/Toast';
import type { Tab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);

  const showToast = useCallback((message: string) => {
    const key = Date.now();
    setToast({ message, key });
    setTimeout(() => setToast(prev => (prev?.key === key ? null : prev)), 2500);
  }, []);

  return (
    <AppProvider>
      <div className="app-shell">
        <main className="screen">
          {activeTab === 'dashboard' && (
            <Dashboard showToast={showToast} onNavigate={setActiveTab} />
          )}
          {activeTab === 'log' && <LogStars showToast={showToast} />}
          {activeTab === 'rewards' && <Rewards showToast={showToast} />}
          {activeTab === 'history' && <History />}
        </main>

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {toast && <Toast key={toast.key} message={toast.message} />}
      </div>
    </AppProvider>
  );
}
