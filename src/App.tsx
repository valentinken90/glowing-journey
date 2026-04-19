import { useState, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import LogStars from './components/LogStars';
import Rewards from './components/Rewards';
import Stats from './components/Stats';
import Flashcards from './components/Flashcards';
import ChildSelector from './components/ChildSelector';
import BackupPanel from './components/BackupPanel';
import Toast from './components/Toast';
import type { Tab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);

  const showToast = useCallback((message: string) => {
    const key = Date.now();
    setToast({ message, key });
    setTimeout(() => setToast(prev => (prev?.key === key ? null : prev)), 2500);
  }, []);

  return (
    <AppProvider>
      <div className="app-shell">
        <header className="top-bar">
          <span className="top-bar-title">⭐ Reading Stars</span>
          <div className="top-bar-actions">
            <ChildSelector showToast={showToast} />
            <button
              className="top-bar-icon-btn"
              onClick={() => setBackupOpen(true)}
              aria-label="Backup"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </button>
          </div>
        </header>

        <main className="screen">
          {activeTab === 'dashboard' && <Dashboard showToast={showToast} onNavigate={setActiveTab} />}
          {activeTab === 'log' && <LogStars showToast={showToast} />}
          {activeTab === 'rewards' && <Rewards showToast={showToast} />}
          {activeTab === 'stats' && <Stats />}
          {activeTab === 'flashcards' && <Flashcards showToast={showToast} />}
        </main>

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        <BackupPanel isOpen={backupOpen} onClose={() => setBackupOpen(false)} showToast={showToast} />

        {toast && <Toast key={toast.key} message={toast.message} />}
      </div>
    </AppProvider>
  );
}
