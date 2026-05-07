import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';
import { invoke } from '@tauri-apps/api/core';
import type { CopySkillResult } from '../../types';

export function InstallDialog() {
  const { installDialogOpen, installDialogSkill, installDialogSkills, installDialogGithub, closeInstallDialog, platforms, skills, loadAll } = useAppStore();
  const t = useTranslation();
  const [copySourceDir, setCopySourceDir] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState(false);
  const [copyResult, setCopyResult] = useState<CopySkillResult | null>(null);

  const detectedPlatforms = platforms.filter((p) => p.detected);
  const isBatchMode = installDialogSkills.length > 0;
  const isGithubMode = installDialogGithub !== null;

  // Per-platform missing skill count for batch mode
  const platformStatus = useMemo(() => {
    if (!isBatchMode) return null;
    return detectedPlatforms.map((p) => {
      const missing = installDialogSkills.filter(
        (name) => !skills.find((s) => s.name === name)?.agents.includes(p.id)
      );
      return { platform: p, missing, allInstalled: missing.length === 0 };
    });
  }, [isBatchMode, detectedPlatforms, installDialogSkills, skills]);

  if (!installDialogOpen) return null;

  const getInstalledSkillSourceDir = (): string | null => {
    if (!installDialogSkill) return null;
    const skill = skills.find((s) => s.name === installDialogSkill);
    if (!skill) return null;
    const paths = Object.values(skill.paths);
    return paths.length > 0 ? paths[0] : null;
  };

  const installedSourceDir = getInstalledSkillSourceDir();
  const effectiveSourceDir = copySourceDir || installedSourceDir || '';

  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleInstall = async () => {
    if (isGithubMode) {
      await handleGithubInstall();
    } else if (isBatchMode) {
      await handleBatchInstall();
    } else {
      await handleSingleInstall();
    }
  };

  const handleGithubInstall = async () => {
    if (!installDialogGithub) return;
    const agents = Array.from(selectedAgents);
    const targetAgents = agents.length > 0 ? agents : detectedPlatforms.map((p) => p.id);
    if (targetAgents.length === 0) return;

    setInstalling(true);
    setCopyResult(null);
    try {
      const res = await invoke<CopySkillResult>('install_github_skill', {
        repoUrl: installDialogGithub.repo,
        skillPath: installDialogGithub.path,
        targetPlatforms: targetAgents,
      });
      setCopyResult(res);
      if (res.success) await loadAll();
    } catch (e) {
      setCopyResult({
        success: false,
        skill_name: '',
        files_copied: 0,
        platforms_completed: [],
        errors: [String(e)],
      });
    } finally { setInstalling(false); }
  };

  const handleSingleInstall = async () => {
    const agents = Array.from(selectedAgents);
    const targetAgents = agents.length > 0 ? agents : detectedPlatforms.map((p) => p.id);

    if (!effectiveSourceDir) return;
    setInstalling(true);
    setCopyResult(null);
    try {
      const res = await invoke<CopySkillResult>('copy_skill', {
        sourceDir: effectiveSourceDir,
        targetPlatforms: targetAgents,
      });
      setCopyResult(res);
      if (res.success) await loadAll();
    } catch (e) {
      setCopyResult({
        success: false,
        skill_name: '',
        files_copied: 0,
        platforms_completed: [],
        errors: [String(e)],
      });
    } finally { setInstalling(false); }
  };

  const handleBatchInstall = async () => {
    const agents = Array.from(selectedAgents);
    const targetAgents = agents.length > 0 ? agents : detectedPlatforms.filter((p) => platformStatus?.find((s) => s.platform.id === p.id && !s.allInstalled)).map((p) => p.id);
    if (targetAgents.length === 0) return;

    setInstalling(true);
    setCopyResult(null);

    let totalFiles = 0;
    const totalPlatforms = new Set<string>();
    const errors: string[] = [];

    for (const skillName of installDialogSkills) {
      const skill = skills.find((s) => s.name === skillName);
      if (!skill) continue;
      const paths = Object.values(skill.paths);
      const sourcePath = paths[0];
      if (!sourcePath) {
        errors.push(`${skillName}: 未找到源路径`);
        continue;
      }

      try {
        const res = await invoke<CopySkillResult>('copy_skill', {
          sourceDir: sourcePath,
          targetPlatforms: targetAgents,
        });
        if (res.success) {
          totalFiles += res.files_copied;
          res.platforms_completed.forEach((p) => totalPlatforms.add(p));
        } else {
          errors.push(...res.errors);
        }
      } catch (e) {
        errors.push(`${skillName}: ${String(e)}`);
      }
    }

    setCopyResult({
      success: errors.length === 0,
      skill_name: installDialogSkills.length > 1 ? `${installDialogSkills.length} 个 Skill` : installDialogSkills[0],
      files_copied: totalFiles,
      platforms_completed: Array.from(totalPlatforms),
      errors,
    });

    if (errors.length === 0) await loadAll();
    setInstalling(false);
  };

  const handleClose = () => {
    setCopySourceDir('');
    setSelectedAgents(new Set());
    setCopyResult(null);
    closeInstallDialog();
  };

  const getTargetPlatformNames = () => {
    const agents = Array.from(selectedAgents);
    const targets = agents.length > 0
      ? detectedPlatforms.filter((p) => agents.includes(p.id))
      : detectedPlatforms;
    return targets.map((p) => p.name).join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="rounded-2xl shadow-2xl w-[520px] max-h-[85vh] overflow-auto" style={{ backgroundColor: 'var(--card)' }}>
        {/* Header */}
        <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--separator)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
              {isGithubMode ? t('install.title') : isBatchMode ? t('install.batchTitle') : t('install.title')}
              {isGithubMode && installDialogGithub && <span className="text-[#007aff] ml-2">{installDialogGithub.path.split('/').pop()}</span>}
              {installDialogSkill && <span className="text-[#007aff] ml-2">{installDialogSkill}</span>}
              {installDialogSkill && <span className="text-[#007aff] ml-2">{installDialogSkill}</span>}
            </h2>
            <button onClick={handleClose} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg-secondary)' }}>
              <span className="text-[13px]">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-7 space-y-7">
          {/* Batch mode: selected skills list */}
          {isBatchMode && (
            <div>
              <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>
                {t('install.batchSkills')} <span className="font-semibold" style={{ color: 'var(--fg)' }}>{installDialogSkills.length}</span> {t('install.batchSkillsUnit')}
              </label>
              <div className="max-h-28 overflow-auto rounded-xl border px-3 py-2" style={{ borderColor: 'var(--separator)' }}>
                {installDialogSkills.map((name) => (
                  <div key={name} className="text-[12px] py-1" style={{ color: 'var(--fg-secondary)' }}>{name}</div>
                ))}
              </div>
            </div>
          )}

          {/* Source input */}
          {!isBatchMode && !isGithubMode && (
            <div>
              <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>{t('install.skillDirPath')}</label>
              {installedSourceDir ? (
                <div className="space-y-2">
                  <div className="bg-[#e8f9ed] rounded-xl px-4 py-3 text-[13px] text-[#34c759]">
                    {t('install.autoDetected')}: <span className="font-mono">{installedSourceDir}</span>
                  </div>
                  <input
                    type="text"
                    placeholder={t('install.useOtherPath')}
                    value={copySourceDir}
                    onChange={(e) => setCopySourceDir(e.target.value)}
                    className="w-full px-4 py-2.5 border-0 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 transition-all"
                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg)' }}
                  />
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder={t('install.dirPlaceholder')}
                    value={copySourceDir}
                    onChange={(e) => setCopySourceDir(e.target.value)}
                    className="w-full px-4 py-2.5 border-0 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 transition-all"
                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg)' }}
                  />
                  <p className="text-[12px] mt-2" style={{ color: 'var(--fg-tertiary)' }}>{t('install.mustContainMd')}</p>
                </>
              )}
            </div>
          )}

          {/* Platforms */}
          <div>
            <label className="block text-[13px] font-medium mb-3" style={{ color: 'var(--fg-secondary)' }}>{t('install.targetPlatforms')}</label>
            <div className="space-y-1.5">
              {(isBatchMode ? platformStatus! : detectedPlatforms.map((p) => ({ platform: p, missing: null, allInstalled: false }))).map((item) => (
                <label key={item.platform.id} className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors" style={{ color: 'var(--fg)' }}>
                  <input
                    type="checkbox"
                    checked={selectedAgents.has(item.platform.id)}
                    onChange={() => toggleAgent(item.platform.id)}
                    className="w-4 h-4 rounded accent-[#007aff]"
                  />
                  <span className="text-[14px] font-medium flex-1" style={{ color: 'var(--fg)' }}>{item.platform.name}</span>
                  {isBatchMode ? (
                    item.allInstalled ? (
                      <span className="text-[12px] text-[#34c759] font-medium">{t('install.batchAllInstalled')}</span>
                    ) : (
                      <span className="text-[12px]" style={{ color: 'var(--fg-tertiary)' }}>
                        {t('install.batchMissing')} {item.missing.length} {t('install.batchMissingUnit')}
                      </span>
                    )
                  ) : (
                    <span className="text-[12px]" style={{ color: 'var(--fg-tertiary)' }}>{item.platform.skill_count} {t('dashboard.skillsCount')}</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Operation preview */}
          {!isBatchMode && (
            <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--input-bg)' }}>
              <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--fg-tertiary)' }}>{t('install.operationPreview')}</div>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--fg)' }}>
                {t('install.copyTo')} <span className="font-mono text-[#007aff]">{effectiveSourceDir || '<目录路径>'}</span>
                {' '}{t('install.to')} {getTargetPlatformNames() || t('install.selectPlatforms')}
              </p>
            </div>
          )}

          {/* Result */}
          {copyResult && (
            <div className={`px-5 py-4 rounded-xl text-[14px] ${copyResult.success ? 'bg-[#e8f9ed] text-[#34c759]' : 'bg-[#ffe8e6] text-[#ff3b30]'}`}>
              {copyResult.success
                ? `${t('install.copySuccess')} ${copyResult.files_copied} ${t('install.filesTo')} ${copyResult.platforms_completed.length} ${t('install.platforms')}`
                : copyResult.errors.join('; ')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t flex justify-end gap-4" style={{ borderColor: 'var(--separator)' }}>
          <button onClick={handleClose} className="px-6 py-2.5 text-[14px] transition-colors" style={{ color: 'var(--fg-secondary)' }}>{t('install.cancel')}</button>
          <button
            onClick={handleInstall}
            disabled={installing || (!isGithubMode && !isBatchMode && !effectiveSourceDir)}
            className="px-6 py-2.5 bg-[#007aff] text-white rounded-full text-[14px] font-medium hover:bg-[#0071e3] disabled:opacity-40 transition-colors shadow-sm"
          >
            {installing ? t('install.installing') : t('install.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
