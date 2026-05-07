import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';

export function SkillDetail() {
  const { selectedSkill, setPage, openInstallDialog, platforms } = useAppStore();
  const t = useTranslation();

  if (!selectedSkill) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-5xl mb-4">📦</span>
        <p className="text-[14px]" style={{ color: 'var(--fg-secondary)' }}>{t('detail.selectHint')}</p>
      </div>
    );
  }

  const detectedPlatforms = platforms.filter((p) => p.detected);

  return (
    <div className="h-full overflow-auto">
      <button onClick={() => setPage('dashboard')} className="mb-8 flex items-center gap-2 text-[#007aff] text-[14px] font-medium hover:opacity-80 transition-opacity">
        <span>←</span><span>{t('detail.back')}</span>
      </button>

      <div className="mb-10">
        <h1 className="text-[36px] font-bold tracking-tight leading-tight" style={{ color: 'var(--fg)' }}>{selectedSkill.name}</h1>
        {selectedSkill.description && <p className="text-[16px] mt-3 leading-relaxed" style={{ color: 'var(--fg-secondary)' }}>{selectedSkill.description}</p>}
      </div>

      <div className="mb-8">
        <h2 className="text-[17px] font-semibold mb-4" style={{ color: 'var(--fg)' }}>{t('detail.installStatus')}</h2>
        <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
          {detectedPlatforms.map((platform, i) => {
            const isInstalled = selectedSkill.agents.includes(platform.id);
            const installPath = selectedSkill.paths[platform.id];
            return (
              <div key={platform.id} className={`flex items-center justify-between px-7 py-5 ${i < detectedPlatforms.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--separator)' }}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isInstalled ? 'bg-[#e8f9ed]' : ''}`} style={!isInstalled ? { backgroundColor: 'var(--input-bg)' } : undefined}>
                    <span className={`text-[12px] ${isInstalled ? 'text-[#34c759]' : ''}`} style={!isInstalled ? { color: 'var(--fg-tertiary)' } : undefined}>{isInstalled ? '✓' : '—'}</span>
                  </div>
                  <div>
                    <div className="text-[14px] font-medium" style={{ color: 'var(--fg)' }}>{platform.name}</div>
                    {isInstalled && installPath && <div className="text-[12px] font-mono mt-1" style={{ color: 'var(--fg-tertiary)' }}>{installPath}</div>}
                  </div>
                </div>
                {!isInstalled && (
                  <button onClick={() => openInstallDialog(selectedSkill.name)} className="px-4 py-1.5 bg-[#007aff] text-white rounded-full text-[12px] font-medium hover:bg-[#0071e3] transition-colors shadow-sm">{t('detail.install')}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedSkill.content && (
        <div className="mb-8">
          <h2 className="text-[17px] font-semibold mb-4" style={{ color: 'var(--fg)' }}>{t('detail.preview')}</h2>
          <div className="rounded-2xl shadow-sm p-7" style={{ backgroundColor: 'var(--card)' }}>
            <pre className="text-[13px] font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-auto" style={{ color: 'var(--fg-secondary)' }}>{selectedSkill.content}</pre>
          </div>
        </div>
      )}

      <button onClick={() => openInstallDialog(selectedSkill.name)} className="px-6 py-2.5 bg-[#007aff] text-white rounded-full text-[14px] font-medium hover:bg-[#0071e3] transition-colors shadow-sm">
        {t('detail.installToOther')}
      </button>
    </div>
  );
}
