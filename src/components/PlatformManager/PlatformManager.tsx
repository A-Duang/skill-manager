import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';

export function PlatformManager() {
  const { platforms, loading, loadPlatforms } = useAppStore();
  const t = useTranslation();

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight leading-tight" style={{ color: 'var(--fg)' }}>{t('platforms.title')}</h1>
          <p className="text-[14px] mt-2" style={{ color: 'var(--fg-secondary)' }}>{t('platforms.detected')} {platforms.filter((p) => p.detected).length} {t('dashboard.platformsSection')}</p>
        </div>
        <button onClick={loadPlatforms} disabled={loading.platforms} className="px-5 py-2 bg-[#007aff] text-white rounded-full text-[13px] font-medium hover:bg-[#0071e3] disabled:opacity-40 transition-colors shadow-sm">
          {loading.platforms ? t('platforms.detecting') : t('platforms.redetect')}
        </button>
      </div>

      <div className="space-y-3">
        {platforms.map((platform) => (
          <div key={platform.id} className={`rounded-2xl p-6 shadow-sm transition-all duration-200 ${platform.detected ? 'hover:shadow-md' : 'opacity-50'}`} style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${platform.detected ? 'bg-[#e8f9ed]' : ''}`} style={!platform.detected ? { backgroundColor: 'var(--input-bg)' } : undefined}>
                  <span className={`text-sm ${platform.detected ? 'text-[#34c759]' : ''}`} style={!platform.detected ? { color: 'var(--fg-tertiary)' } : undefined}>{platform.detected ? '✓' : '—'}</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{platform.name}</h3>
                  <p className="text-[12px] font-mono mt-1" style={{ color: 'var(--fg-tertiary)' }}>{platform.skill_dir}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{platform.skill_count}</div>
                <div className={`text-[12px] font-medium mt-1 ${platform.detected ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>{platform.detected ? t('dashboard.installed') : t('platforms.notDetected')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
