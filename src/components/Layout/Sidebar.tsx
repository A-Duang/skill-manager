import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';
import type { Page } from '../../types';

const navItems: { id: Page; labelKey: 'nav.home' | 'nav.platforms' | 'nav.matrix' | 'nav.market' | 'nav.settings'; icon: string }[] = [
  { id: 'dashboard', labelKey: 'nav.home', icon: '🏠' },
  { id: 'platforms', labelKey: 'nav.platforms', icon: '🖥️' },
  { id: 'matrix', labelKey: 'nav.matrix', icon: '📊' },
  { id: 'market', labelKey: 'nav.market', icon: '🔍' },
  { id: 'settings', labelKey: 'nav.settings', icon: '⚙️' },
];

export function Sidebar() {
  const { currentPage, setPage, stats } = useAppStore();
  const t = useTranslation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#007aff] flex items-center justify-center shadow-sm">
            <span className="text-white text-sm">📦</span>
          </div>
          <span className="text-[16px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>SkillManager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
              currentPage === item.id
                ? 'bg-[#007aff] text-white shadow-sm'
                : ''
            }`}
            style={currentPage !== item.id ? { color: 'var(--fg-secondary)' } : undefined}
          >
            <span className="text-[15px] w-5 text-center">{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      {/* Stats footer */}
      {stats && (
        <div className="px-6 py-5 border-t" style={{ borderColor: 'var(--separator)' }}>
          <div className="space-y-3">
            <div className="flex justify-between text-[11px]">
              <span style={{ color: 'var(--fg-tertiary)' }}>{t('dashboard.detectedPlatforms')}</span>
              <span className="font-medium" style={{ color: 'var(--fg-secondary)' }}>
                {stats.detected_platforms}/{stats.total_platforms}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: 'var(--fg-tertiary)' }}>{t('dashboard.installedSkills')}</span>
              <span className="font-medium" style={{ color: 'var(--fg-secondary)' }}>{stats.total_skills}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
