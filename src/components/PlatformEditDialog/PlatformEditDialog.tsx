import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import type { DetectedPlatform } from '../../types';

interface Props {
  platform: DetectedPlatform | null; // null = adding new custom platform
  open: boolean;
  onClose: () => void;
}

export function PlatformEditDialog({ platform, open, onClose }: Props) {
  const { config, saveConfig, loadAll } = useAppStore();
  const t = useTranslation();
  const isCustom = platform === null;

  const [name, setName] = useState('');
  const [skillPath, setSkillPath] = useState('');
  const [icon, setIcon] = useState('📦');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (platform) {
        setName(platform.name);
        setSkillPath(platform.skill_dir);
      } else {
        setName('');
        setSkillPath('');
        setIcon('📦');
      }
    }
  }, [open, platform]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim() || !skillPath.trim()) return;
    setSaving(true);

    if (platform) {
      // Override existing platform path
      const newOverrides = { ...config.platform_overrides, [platform.id]: skillPath.trim() };
      await saveConfig({ ...config, platform_overrides: newOverrides });
    } else {
      // Add new custom platform
      const id = 'custom-' + name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newPlatform = { id, name: name.trim(), icon, skill_path: skillPath.trim() };
      await saveConfig({
        ...config,
        custom_platforms: [...config.custom_platforms, newPlatform],
      });
    }

    await loadAll();
    setSaving(false);
    onClose();
  };

  const handleReset = async () => {
    if (!platform) return;
    setSaving(true);
    const newOverrides = { ...config.platform_overrides };
    delete newOverrides[platform.id];
    await saveConfig({ ...config, platform_overrides: newOverrides });
    await loadAll();
    setSaving(false);
    onClose();
  };

  const handleRemove = async () => {
    if (!platform || !platform.id.startsWith('custom-')) return;
    setSaving(true);
    const newCustom = config.custom_platforms.filter((p) => p.id !== platform.id);
    await saveConfig({ ...config, custom_platforms: newCustom });
    await loadAll();
    setSaving(false);
    onClose();
  };

  const hasOverride = platform ? config.platform_overrides[platform.id] !== undefined : false;
  const isCustomPlatform = platform ? platform.id.startsWith('custom-') : false;

  const emojiOptions = ['📦', '🤖', '⚡', '🖱️', '🎯', '🌊', '🦞', '💎', '🦘', '🔧', '🛠️', '▶️', '🧑‍💻', '📖', '🕳️', '🧹', '💬', '🚀', '🤝', '📊'];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-[480px] overflow-auto" style={{ backgroundColor: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--separator)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
              {isCustom ? t('platformEdit.addTitle') : `${t('platformEdit.editTitle')} ${platform?.name}`}
            </h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg-secondary)' }}>
              <span className="text-[13px]">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-7 space-y-6">
          {isCustom && (
            <>
              <div>
                <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>{t('platformEdit.name')}</label>
                <input
                  type="text"
                  placeholder={t('platformEdit.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border-0 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 transition-all"
                  style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg)' }}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>{t('platformEdit.icon')}</label>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map((e) => (
                    <button
                      key={e}
                      onClick={() => setIcon(e)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-[18px] transition-all ${
                        icon === e ? 'bg-[#007aff] shadow-sm ring-2 ring-[#007aff]' : ''
                      }`}
                      style={icon !== e ? { backgroundColor: 'var(--input-bg)' } : undefined}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>
              {t('platformEdit.skillPath')}
              {hasOverride && <span className="text-[#ff9500] ml-2 text-[12px]">{t('platformEdit.customized')}</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('platformEdit.pathPlaceholder')}
                value={skillPath}
                onChange={(e) => setSkillPath(e.target.value)}
                className="flex-1 px-4 py-2.5 border-0 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 transition-all"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg)' }}
              />
              <button onClick={async () => { const selected = await openDialog({ directory: true }); if (selected) setSkillPath(selected); }}
                className="px-3 py-2.5 rounded-xl text-[14px] transition-colors flex-shrink-0"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg-secondary)' }}>
                📁
              </button>
            </div>
            {platform && (
              <p className="text-[12px] mt-2" style={{ color: 'var(--fg-tertiary)' }}>{t('platformEdit.defaultPath')}: {platform.skill_dir}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t flex justify-between" style={{ borderColor: 'var(--separator)' }}>
          <div>
            {platform && hasOverride && !isCustomPlatform && (
              <button onClick={handleReset} disabled={saving} className="px-4 py-2 text-[13px] text-[#ff9500] hover:text-[#e68600] transition-colors">
                {t('platformEdit.restoreDefault')}
              </button>
            )}
            {isCustomPlatform && (
              <button onClick={handleRemove} disabled={saving} className="px-4 py-2 text-[13px] text-[#ff3b30] hover:text-[#e63333] transition-colors">
                {t('platformEdit.deletePlatform')}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 text-[14px] transition-colors" style={{ color: 'var(--fg-secondary)' }}>{t('common.cancel')}</button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !skillPath.trim()}
              className="px-5 py-2 bg-[#007aff] text-white rounded-full text-[13px] font-medium hover:bg-[#0071e3] disabled:opacity-40 transition-colors shadow-sm"
            >
              {saving ? t('platformEdit.saving') : t('platformEdit.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
