import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';
import { open } from '@tauri-apps/plugin-dialog';
import type { AppConfig } from '../../types';

export function Settings() {
  const { config, saveConfig, loadAll } = useAppStore();
  const t = useTranslation();
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [newDirPath, setNewDirPath] = useState('');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await saveConfig(localConfig);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  const addCustomDir = () => {
    if (!newDirName.trim() || !newDirPath.trim()) return;
    setLocalConfig((prev) => ({
      ...prev,
      custom_skill_dirs: [...prev.custom_skill_dirs, { name: newDirName.trim(), path: newDirPath.trim() }],
    }));
    setNewDirName('');
    setNewDirPath('');
  };

  const removeCustomDir = (index: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      custom_skill_dirs: prev.custom_skill_dirs.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight leading-tight" style={{ color: 'var(--fg)' }}>{t('settings.title')}</h1>
          <p className="text-[14px] mt-2" style={{ color: 'var(--fg-secondary)' }}>{t('settings.subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#007aff] text-white rounded-full text-[13px] font-medium hover:bg-[#0071e3] disabled:opacity-40 transition-colors shadow-sm"
        >
          {saving ? t('settings.saving') : saved ? t('settings.saved') : t('settings.saveSettings')}
        </button>
      </div>

      <div className="space-y-8">
        {/* GitHub Token */}
        <Section title={t('settings.githubToken')} description={t('settings.githubTokenDesc')}>
          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>{t('settings.githubTokenLabel')}</label>
            <input
              type="password"
              placeholder={t('settings.githubTokenPlaceholder')}
              value={localConfig.github_token}
              onChange={(e) => updateField('github_token', e.target.value)}
              className="w-full max-w-lg px-4 py-2.5 border-0 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 transition-all"
              style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg)' }}
            />
            <p className="text-[12px] mt-2" style={{ color: 'var(--fg-tertiary)' }}>
              {t('settings.githubTokenHint')}
            </p>
          </div>
        </Section>

        {/* Custom Skill Directories */}
        <Section title={t('settings.customDirs')} description={t('settings.customDirsDesc')}>
          <div className="space-y-4">
            {localConfig.custom_skill_dirs.map((dir, index) => (
              <div key={index} className="flex items-center gap-4 rounded-xl px-5 py-3.5" style={{ backgroundColor: 'var(--bg)' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium" style={{ color: 'var(--fg)' }}>{dir.name}</div>
                  <div className="text-[12px] font-mono truncate mt-0.5" style={{ color: 'var(--fg-tertiary)' }}>{dir.path}</div>
                </div>
                <button
                  onClick={() => removeCustomDir(index)}
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'var(--card)', color: 'var(--fg-secondary)' }}
                >
                  <span className="text-[13px]">×</span>
                </button>
              </div>
            ))}

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[12px] mb-1.5" style={{ color: 'var(--fg-secondary)' }}>{t('settings.name')}</label>
                <input type="text" placeholder={t('settings.namePlaceholder')} value={newDirName} onChange={(e) => setNewDirName(e.target.value)}
                  className="w-full px-4 py-2.5 border-0 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 transition-all"
                  style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg)' }} />
              </div>
              <div className="flex-[2]">
                <label className="block text-[12px] mb-1.5" style={{ color: 'var(--fg-secondary)' }}>{t('settings.path')}</label>
                <div className="flex gap-2">
                  <input type="text" placeholder={t('settings.pathPlaceholder')} value={newDirPath} onChange={(e) => setNewDirPath(e.target.value)}
                    className="flex-1 px-4 py-2.5 border-0 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 transition-all"
                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg)' }} />
                  <button onClick={async () => { const selected = await open({ directory: true }); if (selected) setNewDirPath(selected); }}
                    className="px-3 py-2.5 rounded-xl text-[14px] transition-colors flex-shrink-0"
                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg-secondary)' }}>
                    📁
                  </button>
                </div>
              </div>
              <button onClick={addCustomDir} disabled={!newDirName.trim() || !newDirPath.trim()}
                className="px-5 py-2.5 bg-[#007aff] text-white rounded-xl text-[13px] font-medium hover:bg-[#0071e3] disabled:opacity-40 transition-colors shadow-sm whitespace-nowrap">
                {t('settings.add')}
              </button>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section title={t('settings.appearance')} description={t('settings.appearanceDesc')}>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>{t('settings.theme')}</label>
              <div className="flex gap-3">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button key={theme} onClick={() => updateField('theme', theme)}
                    className={`px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      localConfig.theme === theme ? 'bg-[#007aff] text-white shadow-sm' : ''
                    }`}
                    style={localConfig.theme !== theme ? { backgroundColor: 'var(--input-bg)', color: 'var(--fg-secondary)' } : undefined}>
                    {t(`settings.${theme}` as 'settings.light' | 'settings.dark' | 'settings.system')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>{t('settings.language')}</label>
              <div className="flex gap-3">
                {(['zh', 'en'] as const).map((lang) => (
                  <button key={lang} onClick={() => updateField('language', lang)}
                    className={`px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      localConfig.language === lang ? 'bg-[#007aff] text-white shadow-sm' : ''
                    }`}
                    style={localConfig.language !== lang ? { backgroundColor: 'var(--input-bg)', color: 'var(--fg-secondary)' } : undefined}>
                    {lang === 'zh' ? '中文' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* About */}
        <Section title={t('settings.about')} description={t('settings.aboutDesc')}>
          <div className="space-y-3">
            <InfoRow label={t('settings.version')} value="1.0.0" />
            <InfoRow label={t('settings.configFile')} value="~/.skillmanager/config.json" mono />
            <div className="pt-3">
              <button onClick={() => loadAll()}
                className="px-5 py-2 rounded-full text-[13px] font-medium transition-colors"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg)' }}>
                {t('settings.redetect')}
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl shadow-sm p-7" style={{ backgroundColor: 'var(--card)' }}>
      <h2 className="text-[17px] font-semibold mb-1" style={{ color: 'var(--fg)' }}>{title}</h2>
      <p className="text-[13px] mb-6" style={{ color: 'var(--fg-secondary)' }}>{description}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[14px]" style={{ color: 'var(--fg-secondary)' }}>{label}</span>
      <span className={`text-[14px] font-medium ${mono ? 'font-mono text-[13px]' : ''}`} style={{ color: mono ? 'var(--fg-tertiary)' : 'var(--fg)' }}>{value}</span>
    </div>
  );
}
