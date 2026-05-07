import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { I18nProvider } from './i18n';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PlatformManager } from './components/PlatformManager/PlatformManager';
import { MatrixView } from './components/MatrixView/MatrixView';
import { SkillDetail } from './components/SkillDetail/SkillDetail';
import { Market } from './components/Market/Market';
import { Settings } from './components/Settings/Settings';
import { InstallDialog } from './components/InstallDialog/InstallDialog';
import { SyncDialog } from './components/SyncDialog/SyncDialog';

function AppContent() {
  const { currentPage } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'skills':
        return <SkillDetail />;
      case 'platforms':
        return <PlatformManager />;
      case 'matrix':
        return <MatrixView />;
      case 'market':
        return <Market />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen p-4 pr-5 gap-4" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Sidebar card */}
      <aside className="w-56 rounded-2xl shadow-sm flex flex-col h-full flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
        <div className="h-full overflow-auto">
          <Sidebar />
        </div>
      </aside>

      {/* Main content card */}
      <main className="flex-1 rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
        <div className="h-full overflow-auto p-10">
          {renderPage()}
        </div>
      </main>

      <InstallDialog />
      <SyncDialog />
    </div>
  );
}

function App() {
  const { loadAll, config } = useAppStore();

  useEffect(() => {
    loadAll();
  }, []);

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      if (config.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (config.theme === 'light') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        // system
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    };

    applyTheme();

    if (config.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [config.theme]);

  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
