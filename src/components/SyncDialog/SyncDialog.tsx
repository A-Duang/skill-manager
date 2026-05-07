import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';
import type { SyncResult } from '../../types';

export function SyncDialog() {
  const { syncDialogOpen, closeSyncDialog, platforms, skills, loadAll } = useAppStore();
  const t = useTranslation();
  const [sourcePlatform, setSourcePlatform] = useState<string>('');
  const [targetPlatforms, setTargetPlatforms] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  if (!syncDialogOpen) return null;

  const detectedPlatforms = platforms.filter((p) => p.detected);
  const availableTargets = detectedPlatforms.filter((p) => p.id !== sourcePlatform);
  const sourceSkills = sourcePlatform
    ? skills.filter((s) => s.agents.includes(sourcePlatform) && !s.name.startsWith('.'))
    : [];

  const toggleTarget = (id: string) => {
    setTargetPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSync = async () => {
    if (!sourcePlatform || targetPlatforms.size === 0) return;
    setSyncing(true);
    setResult(null);
    try {
      const res = await invoke<SyncResult>('sync_platform_skills', {
        sourcePlatform,
        targetPlatforms: Array.from(targetPlatforms),
      });
      setResult(res);
      if (res.success) {
        await loadAll();
      }
    } catch (e) {
      setResult({
        success: false,
        total_skills: 0,
        files_copied: 0,
        skills_synced: [],
        skills_skipped: [],
        platforms_completed: [],
        errors: [String(e)],
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleClose = () => {
    setSourcePlatform('');
    setTargetPlatforms(new Set());
    setResult(null);
    closeSyncDialog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="w-[540px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
        {/* Header */}
        <div className="px-7 py-5 border-b" style={{ borderColor: 'var(--separator)' }}>
          <h2 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>{t('sync.title')}</h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--fg-secondary)' }}>{t('sync.subtitle')}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-7 py-5 space-y-5">
          {/* Source Platform */}
          <div>
            <label className="text-[13px] font-medium mb-2 block" style={{ color: 'var(--fg)' }}>{t('sync.source')}</label>
            <p className="text-[12px] mb-3" style={{ color: 'var(--fg-tertiary)' }}>{t('sync.sourceHint')}</p>
            <div className="grid grid-cols-2 gap-2">
              {detectedPlatforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSourcePlatform(p.id);
                    setTargetPlatforms((prev) => {
                      const next = new Set(prev);
                      next.delete(p.id);
                      return next;
                    });
                    setResult(null);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] border transition-all text-left"
                  style={{
                    borderColor: sourcePlatform === p.id ? '#007aff' : 'var(--separator)',
                    backgroundColor: sourcePlatform === p.id ? '#007aff10' : 'transparent',
                    color: 'var(--fg)',
                  }}
                >
                  <span className="text-[15px]">{p.skill_count}</span>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Platforms */}
          <div>
            <label className="text-[13px] font-medium mb-2 block" style={{ color: 'var(--fg)' }}>{t('sync.targets')}</label>
            <p className="text-[12px] mb-3" style={{ color: 'var(--fg-tertiary)' }}>{t('sync.targetsHint')}</p>
            {availableTargets.length === 0 ? (
              <p className="text-[12px]" style={{ color: 'var(--fg-tertiary)' }}>{t('sync.noSource')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableTargets.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] border cursor-pointer transition-all"
                    style={{
                      borderColor: targetPlatforms.has(p.id) ? '#007aff' : 'var(--separator)',
                      backgroundColor: targetPlatforms.has(p.id) ? '#007aff10' : 'transparent',
                      color: 'var(--fg)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={targetPlatforms.has(p.id)}
                      onChange={() => toggleTarget(p.id)}
                      className="w-4 h-4 rounded accent-[#007aff]"
                    />
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto text-[11px]" style={{ color: 'var(--fg-tertiary)' }}>{p.skill_count}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {sourcePlatform && sourceSkills.length > 0 && (
            <div>
              <label className="text-[13px] font-medium mb-2 block" style={{ color: 'var(--fg)' }}>
                {t('sync.preview')} ({sourceSkills.length})
              </label>
              <div className="max-h-32 overflow-auto rounded-xl border px-3 py-2" style={{ borderColor: 'var(--separator)' }}>
                {sourceSkills.map((s) => (
                  <div key={s.name} className="text-[12px] py-1 flex items-center gap-2" style={{ color: 'var(--fg-secondary)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] flex-shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sourcePlatform && sourceSkills.length === 0 && (
            <p className="text-[12px]" style={{ color: 'var(--fg-tertiary)' }}>{t('sync.noSkills')}</p>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: result.success ? '#e8f9ed' : '#fef1f0' }}>
              {result.success ? (
                <div>
                  <div className="text-[13px] font-medium text-[#34c759]">{t('sync.success')}</div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--fg-secondary)' }}>
                    {t('sync.result')} {result.skills_synced.length} {t('sync.skillsTo')} {result.platforms_completed.length} {t('sync.platforms')}
                  </div>
                  {result.skills_skipped.length > 0 && (
                    <div className="text-[12px] mt-1" style={{ color: 'var(--fg-tertiary)' }}>
                      {t('sync.skipped')} {result.skills_skipped.length} {t('sync.skippedHint')}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-[13px] font-medium text-[#ff3b30]">{t('sync.failed')}</div>
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-[12px] mt-1" style={{ color: 'var(--fg-secondary)' }}>{e}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: 'var(--separator)' }}>
          <button onClick={handleClose} className="px-5 py-2 rounded-full text-[13px] font-medium border transition-colors hover:bg-[#e5e5ea]" style={{ borderColor: 'var(--separator)', color: 'var(--fg-secondary)' }}>
            {result?.success ? t('common.close') : t('common.cancel')}
          </button>
          {!result?.success && (
            <button
              onClick={handleSync}
              disabled={!sourcePlatform || targetPlatforms.size === 0 || syncing}
              className="px-5 py-2 bg-[#007aff] text-white rounded-full text-[13px] font-medium hover:bg-[#0071e3] disabled:opacity-40 transition-colors shadow-sm"
            >
              {syncing ? t('sync.syncing') : t('sync.confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
